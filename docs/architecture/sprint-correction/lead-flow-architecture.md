# Lead Flow Architecture

**Status:** Phase 3 implemented — Phase 3b expansion defined here
**Scope:** Lead scoring, qualification signals, Telegram handover

---

## Signal Categories

Lead intelligence combines two signal types:

**Conversational signals** — extracted from Max chat turns.
**Behavioural signals** — tracked from page interaction events.

Both are stored in `chat.sessions.metadata` and `chat.events`. The
combined score drives qualification and handover timing.

---

## Conversational Signals (Phase 3 — implemented)

| Signal | Max weight |
|--------|-----------|
| Business type matched | 20 |
| Pain named and confirmed | 30 |
| Volume bracket identified | 25 |
| Current system described | 25 |
| **Max conversational score** | **100** |

---

## Behavioural Signals (Phase 3b — defined, not yet implemented)

### Engagement depth

| Signal | Weight | Source |
|--------|--------|--------|
| Scroll depth ≥ 90% on landing | +5 | `chat.events` scroll |
| Dwell time > 3 min on landing | +10 | `chat.events` time_on_page_ms |
| Dwell time > 5 min | +5 additional | same |
| Walkaround module opened | +15 | click event per module |
| Demo CTA clicked | +20 | CTA click event |
| FAQ item opened and read | +8 per item (max +24) | FAQ click event |
| Video played > 50% (Phase 5) | +15 | play progress event |

### Return and repetition signals

| Signal | Weight | Source |
|--------|--------|--------|
| Return visit (visit_count > 1) | +10 | `chat.sessions` visit_count |
| Same page revisited | +10 | page view event, URL match |
| Pricing page visited twice | +15 | URL pattern |
| Demo section revisited | +15 | URL + scroll to section |
| Max conversation resumed | +12 | session reopen after 1h+ gap |

### Intent language signals (extracted from Max chat)

| Pattern | Weight | Notes |
|---------|--------|-------|
| "I need" / "ich brauche" | +15 | Urgency |
| "urgent" / "dringend" | +15 | Urgency |
| "problem" / "Problem" | +10 | Active pain |
| "ASAP" / "sofort" | +15 | Urgency |
| "how much" / "was kostet" | +15 | Pricing intent |
| "how do I start" / "wie fange ich an" | +12 | Buy signal |
| "when can we" / "wann können wir" | +12 | Buy signal |
| "my team" / "mein Team" | +8 | Scope signal |
| Mentions specific number (staff, jobs, revenue) | +8 | Qualified context |

---

## Combined Score and Thresholds

```
Combined score = conversational score + behavioural score

≥ 80  → HOT LEAD    → Telegram handover fires
60–79 → WARM LEAD   → Nurture sequence, Max continues
40–59 → INTERESTED  → Max stays in conversation mode
< 40  → COLD        → No action, organic engagement only
```

---

## Signal Decay

Behavioural signals older than 30 days reduce to 50% weight.
A visitor who read the pricing page 6 weeks ago and hasn't returned
scores less than one who read it yesterday.

Conversational signals do not decay — confirmed intent is confirmed intent.

---

## Lead Stage Transitions

```
cold
  → (scroll depth ≥ 50% OR 2+ messages) → interested
  → (walkaround engaged OR FAQ opened OR return visit) → warm
  → (combined score ≥ 80 OR "urgent" signal OR demo request) → hot
```

Stage is stored in `chat.sessions.metadata.lead_stage`. Max reads it
at conversation start and adjusts depth of qualification accordingly.

---

## Telegram Handover (Phase 3b — stub implemented)

Fires when combined score ≥ 80 OR visitor explicitly requests to speak
with a human.

Telegram message format:
```
🔥 HOT LEAD — Score: {n}/100+

Business: {type}
Problem: {pain}
Volume: {volume}
System: {current}
Behaviour: visited demo twice, 3 FAQ objections, 7 min dwell

Name: {name}
Contact: {phone/email}
Host: {domain}
Language: {locale}

Last Max message: "{final_user_message}"
```

After handover fires, Max enters `handover` mode. It does not restart
conversation. It holds context and waits for the human agent.

---

## Memory Integration

Lead signals inform Max's system prompt on return visits:

```
[Lead context]
Stage: warm
Signals: pricing page ×2, FAQ "Does it integrate with DATEV?", 4 min dwell
Prior conversation: manual invoicing, 12 staff
```

Max opens at the right depth — not from zero.
See `walkaround-architecture.md` for Max memory expansion.
