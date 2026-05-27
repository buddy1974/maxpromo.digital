'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocale } from 'next-intl'

// ── Flow definition ────────────────────────────────────────────

type QuestionKey = 'business' | 'pain' | 'volume' | 'system'

interface QOption { text: string; weight: number }
interface QDef {
  key:     QuestionKey
  bot:     string
  options: QOption[]
  ack:     (ans: string) => string | null
}

// FIX 2–5: Updated question strings
const QUESTIONS: QDef[] = [
  {
    key: 'business',
    bot: 'What kind of business are we fixing today?',           // FIX 2
    options: [
      { text: 'Restaurant / Café',  weight: 18 },
      { text: 'Trades / Handwerk',  weight: 20 },
      { text: 'Health / Clinic',    weight: 16 },
      { text: 'Retail / Shop',      weight: 14 },
      { text: 'Other',              weight: 10 },
    ],
    ack: (a) => `${a.split(' / ')[0]}. Got it.`,
  },
  {
    key: 'pain',
    bot: 'Where is your business leaking time or money right now?',  // FIX 3
    options: [
      { text: 'Missed calls & enquiries',  weight: 28 },
      { text: 'Manual invoicing / admin',  weight: 30 },
      { text: 'No-shows / cancellations',  weight: 24 },
      { text: 'Disconnected tools',         weight: 26 },
      { text: 'Team chaos',                 weight: 22 },
    ],
    ack: () => 'That one costs real hours.',
  },
  {
    key: 'volume',
    bot: 'Roughly how many requests or customers do you handle weekly?\n\n(This shows how much you\'re losing if nothing is automated.)',  // FIX 4
    options: [
      { text: 'Under 10',   weight: 5  },
      { text: '10 – 50',    weight: 20 },
      { text: '50 – 200',   weight: 25 },
      { text: 'Over 200',   weight: 22 },
    ],
    ack: () => 'Understood.',
  },
  {
    key: 'system',
    bot: 'How are you currently handling this?\n\nBe honest — most businesses are still using WhatsApp, paper, or spreadsheets.',  // FIX 5
    options: [
      { text: 'WhatsApp / paper',  weight: 25 },
      { text: 'Spreadsheets',      weight: 20 },
      { text: 'Old software',      weight: 18 },
      { text: 'Nothing yet',       weight: 22 },
    ],
    ack: () => null,
  },
]

// Max score = 20 + 30 + 25 + 25 = 100
const HIGH_SCORE_THRESHOLD = 80

// FIX 7: Decision options
const DECISION_OPTIONS = [
  { label: 'Yes, show me', value: 'yes' },
  { label: 'Not now',      value: 'no'  },
]

// ── Types ──────────────────────────────────────────────────────

interface QAnswer { text: string; weight: number }
interface Answers {
  business?:     QAnswer
  pain?:         QAnswer
  volume?:       QAnswer
  system?:       QAnswer
  contactName?:  string
  contactPhone?: string
}

// FIX 7: Added 'decision' phase
type InputPhase = 'options' | 'decision' | 'name' | 'phone' | 'done' | 'low'

interface Msg { id: string; from: 'bot' | 'user'; text: string }

let seq = 0
const uid = () => String(++seq)

// ── Component ──────────────────────────────────────────────────

export function MaxAgent() {
  const [open,         setOpen]         = useState(false)
  const [msgs,         setMsgs]         = useState<Msg[]>([])
  const [typing,       setTyping]       = useState(false)
  const [step,         setStep]         = useState(0)
  const [answers,      setAnswers]      = useState<Answers>({})
  const [inputPhase,   setInputPhase]   = useState<InputPhase>('options')
  const [inputVal,     setInputVal]     = useState('')
  const [score,        setScore]        = useState(0)
  const [locked,       setLocked]       = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)  // FIX 11: anchor for smooth scroll
  const inputRef  = useRef<HTMLInputElement>(null)
  const locale    = useLocale()

  // ── Event listener ─────────────────────────────────────────

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('open-max-chat', onOpen)
    return () => window.removeEventListener('open-max-chat', onOpen)
  }, [])

  // ── Helpers ────────────────────────────────────────────────

  const addBot = useCallback((text: string, delay = 800): Promise<void> =>
    new Promise((resolve) => {
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        setMsgs((p) => [...p, { id: uid(), from: 'bot', text }])
        resolve()
      }, delay)
    }), [])

  const addUser = (text: string) =>
    setMsgs((p) => [...p, { id: uid(), from: 'user', text }])

  // FIX 11: Smooth auto-scroll to bottom anchor
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, typing])

  // Focus input
  useEffect(() => {
    if (inputPhase === 'name' || inputPhase === 'phone')
      setTimeout(() => inputRef.current?.focus(), 80)
  }, [inputPhase])

  // ── Start flow ─────────────────────────────────────────────

  // FIX 1: New opening — pain-first, not AI-tool energy
  useEffect(() => {
    if (!open || msgs.length > 0) return
    ;(async () => {
      await addBot('Hey — quick question.', 550)
      await new Promise(res => setTimeout(res, 500))   // FIX 10: inter-message pause
      await addBot('Are you losing customers because nobody replies fast enough?', 850)
      await new Promise(res => setTimeout(res, 500))   // FIX 10
      await addBot(QUESTIONS[0].bot, 750)
    })()
  }, [open, msgs.length, addBot])

  // ── Handle quick-reply selection ───────────────────────────

  const handleOption = useCallback(async (opt: QOption) => {
    if (locked) return           // FIX 12: input lock guard
    setLocked(true)
    addUser(opt.text)

    const q = QUESTIONS[step]

    // Store answer
    const updated: Answers = { ...answers }
    switch (q.key) {
      case 'business': updated.business = opt; break
      case 'pain':     updated.pain     = opt; break
      case 'volume':   updated.volume   = opt; break
      case 'system':   updated.system   = opt; break
    }
    setAnswers(updated)

    const ack = q.ack(opt.text)
    if (ack) await addBot(ack, 550)

    const next = step + 1

    if (next < QUESTIONS.length) {
      await new Promise(res => setTimeout(res, 500))   // FIX 10
      await addBot(QUESTIONS[next].bot, 650)
      setStep(next)
      setLocked(false)
    } else {
      // Score
      const total =
        (updated.business?.weight ?? 0) +
        (updated.pain?.weight     ?? 0) +
        (updated.volume?.weight   ?? 0) +
        (updated.system?.weight   ?? 0)
      setScore(total)

      if (total >= HIGH_SCORE_THRESHOLD) {
        // FIX 6: Replace "Strong match." with diagnosis framing
        await new Promise(res => setTimeout(res, 500))   // FIX 10
        await addBot('Alright — I see what\'s happening.', 700)
        await new Promise(res => setTimeout(res, 400))   // FIX 10
        await addBot('You\'re losing time every day on things that should already be automated.\n\nWe\'ve built systems that fix exactly this.', 1000)
        // FIX 7: Decision step — value proposition + Yes/No
        await new Promise(res => setTimeout(res, 500))   // FIX 10
        await addBot('If we fix this properly, you could save 5–10 hours per week.\n\nDo you want me to show you what your system would look like?', 1100)
        setInputPhase('decision')
        setLocked(false)
      } else {
        await addBot("There's still a fit here — but let's confirm it.", 800)
        await addBot('Our free audit takes 3 minutes and gives you a full picture.', 950)
        setInputPhase('low')
      }
    }
  }, [locked, step, answers, addBot])

  // FIX 7: Handle decision (Yes / Not now)
  const handleDecision = useCallback(async (value: string) => {
    if (locked) return
    setLocked(true)

    if (value === 'yes') {
      addUser('Yes, show me')
      // FIX 8: Humanized contact ask
      await addBot('Perfect.\n\nWhere should we send your system setup?\n\n(Name + WhatsApp or Email)', 800)
      setInputPhase('name')
      setLocked(false)
    } else {
      addUser('Not now')
      await addBot('No problem — you can come back anytime.', 700)
      setInputPhase('done')
      setTimeout(() => handleClose(), 2500)
    }
  }, [locked, addBot]) // handleClose added below after definition

  // ── Reset + close ─────────────────────────────────────────

  const handleClose = useCallback(() => {
    setOpen(false)
    setTimeout(() => {
      setMsgs([])
      setStep(0)
      setAnswers({})
      setInputPhase('options')
      setInputVal('')
      setScore(0)
      setLocked(false)
    }, 350)
  }, [])

  // ── Handle text input ──────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const val = inputVal.trim()
    if (!val) return          // FIX 12: guard empty input
    setInputVal('')

    if (inputPhase === 'name') {
      addUser(val)
      setAnswers((p) => ({ ...p, contactName: val }))
      await addBot(`Nice to meet you, ${val.split(' ')[0]}. Best phone or email to reach you?`, 700)
      setInputPhase('phone')
    } else if (inputPhase === 'phone') {
      addUser(val)
      setAnswers((p) => ({ ...p, contactPhone: val }))
      setInputPhase('done')
      await addBot('Perfect. Sending your details now.', 500)

      try {
        await fetch('/api/max-agent/submit', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            score,
            business: answers.business?.text,
            pain:     answers.pain?.text,
            volume:   answers.volume?.text,
            system:   answers.system?.text,
            name:     answers.contactName,
            phone:    val,
            locale,
          }),
        })
      } catch { /* fail silent — UX unaffected */ }

      const first = (answers.contactName ?? val).split(' ')[0]
      await addBot(`You'll hear from us within a few hours, ${first}.`, 800)
      await addBot('// Done.', 500)
      setTimeout(() => handleClose(), 2200)
    }
  }, [inputPhase, inputVal, answers, score, locale, addBot, handleClose])

  const currentOptions =
    inputPhase === 'options' && step < QUESTIONS.length
      ? QUESTIONS[step].options
      : []

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      <style>{`
        .max-agent-window {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          border-radius: 20px 20px 0 0;
          max-height: 88dvh;
        }
        @media (min-width: 768px) {
          .max-agent-window {
            bottom: 90px;
            left: auto;
            right: 24px;
            width: 380px;
            max-height: 600px;
            border-radius: 16px;
          }
        }
      `}</style>

      {/* Desktop trigger */}
      <motion.button
        className="hidden md:flex"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.97 }}
        style={{
          position:    'fixed',
          bottom:      '88px',
          right:       '24px',
          zIndex:      80,
          height:      '40px',
          padding:     '0 18px',
          borderRadius: '20px',
          background:  '#F97316',
          border:      'none',
          cursor:      'pointer',
          alignItems:  'center',
          gap:         '7px',
          fontFamily:  'var(--font-mono)',
          fontWeight:  700,
          fontSize:    '12px',
          letterSpacing: '0.06em',
          color:       'hsl(240 14% 4%)',
          boxShadow:   '0 0 20px rgba(249,115,22,0.30)',
          whiteSpace:  'nowrap',
        }}
      >
        <span style={{ fontSize: '11px' }}>▸</span>
        FREE AUDIT
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="max-agent"
            className="max-agent-window"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{ y: 32,   opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{
              zIndex:     95,
              background: 'hsl(240 14% 4%)',
              border:     '1px solid hsl(40 30% 96% / 0.08)',
              display:    'flex',
              flexDirection: 'column',
              overflow:   'hidden',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              display:       'flex',
              alignItems:    'center',
              justifyContent: 'space-between',
              padding:       '14px 16px',
              borderBottom:  '1px solid hsl(40 30% 96% / 0.07)',
              flexShrink:    0,
              background:    'hsl(240 12% 6%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#F97316', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: 'var(--font-mono)',
                  fontWeight: 700, fontSize: '13px', color: 'hsl(240 14% 4%)',
                  flexShrink: 0,
                }}>M</div>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'hsl(40 30% 96%)', margin: 0, letterSpacing: '0.06em' }}>
                    Max
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', margin: 0, letterSpacing: '0.1em' }}>
                    // Business Advisor
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                style={{
                  background: 'none', border: 'none', color: 'hsl(40 12% 45%)',
                  cursor: 'pointer', fontSize: '18px', padding: '8px',
                  lineHeight: 1, borderRadius: '6px', minWidth: '36px', minHeight: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>

            {/* ── Messages ── */}
            <div
              ref={scrollRef}
              style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: '8px',
              }}
              className="chat-scroll"
            >
              <AnimatePresence initial={false}>
                {msgs.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{
                      maxWidth: '82%',
                      padding: '10px 14px',
                      borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                      background: m.from === 'user' ? '#F97316' : 'hsl(240 12% 8%)',
                      border: m.from === 'user' ? 'none' : '1px solid hsl(40 30% 96% / 0.07)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      lineHeight: 1.55,
                      color: m.from === 'user' ? 'hsl(240 14% 4%)' : 'hsl(40 30% 96%)',
                      fontWeight: m.from === 'user' ? 600 : 400,
                      whiteSpace: 'pre-line',   // renders \n as line breaks
                    }}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'flex', justifyContent: 'flex-start' }}
                  >
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '4px 14px 14px 14px',
                      background: 'hsl(240 12% 8%)',
                      border: '1px solid hsl(40 30% 96% / 0.07)',
                      display: 'flex', gap: '4px', alignItems: 'center',
                    }}>
                      <span className="typing-dot" />
                      <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
                      <span className="typing-dot" style={{ animationDelay: '0.30s' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FIX 11: Scroll anchor */}
              <div ref={bottomRef} />
            </div>

            {/* ── Bottom — quick replies / decision / input / result ── */}
            <div style={{
              flexShrink: 0,
              padding: '12px 16px',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
              borderTop: '1px solid hsl(40 30% 96% / 0.07)',
              background: 'hsl(240 12% 6%)',
            }}>

              {/* Quick replies */}
              {currentOptions.length > 0 && !locked && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {currentOptions.map((opt) => (
                    <motion.button
                      key={opt.text}
                      onClick={() => handleOption(opt)}
                      whileTap={{ scale: 0.96 }}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: '12px',
                        color: '#F97316',
                        background: 'rgba(249,115,22,0.07)',
                        border: '1px solid rgba(249,115,22,0.25)',
                        borderRadius: '8px',
                        padding: '8px 13px',
                        cursor: 'pointer',
                        letterSpacing: '0.02em',
                        transition: 'background 120ms ease, border-color 120ms ease',
                        minHeight: '36px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(249,115,22,0.16)'
                        e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(249,115,22,0.07)'
                        e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)'
                      }}
                    >
                      {opt.text}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Processing */}
              {currentOptions.length > 0 && locked && inputPhase === 'options' && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 35%)', margin: 0 }}>
                  // thinking...
                </p>
              )}

              {/* FIX 7: Decision buttons — Yes / Not now */}
              {inputPhase === 'decision' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {DECISION_OPTIONS.map((d) => (
                    <motion.button
                      key={d.value}
                      onClick={() => handleDecision(d.value)}
                      whileTap={{ scale: 0.96 }}
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '13px',
                        letterSpacing: '0.03em',
                        minHeight: '44px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: 'none',
                        ...(d.value === 'yes'
                          ? { background: '#F97316', color: 'hsl(240 14% 4%)' }
                          : { background: 'hsl(240 12% 10%)', color: 'hsl(40 12% 45%)', border: '1px solid hsl(40 30% 96% / 0.10)' }
                        ),
                      }}
                    >
                      {d.label}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Name / phone input */}
              {(inputPhase === 'name' || inputPhase === 'phone') && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    ref={inputRef}
                    type={inputPhase === 'phone' ? 'tel' : 'text'}
                    placeholder={inputPhase === 'name' ? 'Your name' : 'Phone or email'}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit() }}
                    style={{
                      flex: 1,
                      background: 'hsl(240 12% 8%)',
                      border: '1px solid hsl(40 30% 96% / 0.10)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      color: 'hsl(40 30% 96%)',
                      outline: 'none',
                      minHeight: '44px',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)')}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = 'hsl(40 30% 96% / 0.10)')}
                  />
                  <motion.button
                    onClick={() => void handleSubmit()}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      background: '#F97316', border: 'none', borderRadius: '8px',
                      padding: '10px 18px', fontFamily: 'var(--font-mono)',
                      fontWeight: 700, fontSize: '14px', color: 'hsl(240 14% 4%)',
                      cursor: 'pointer', minHeight: '44px', flexShrink: 0,
                    }}
                  >→</motion.button>
                </div>
              )}

              {/* Low-score CTA */}
              {inputPhase === 'low' && (
                <a
                  href="/automation-audit"
                  style={{
                    display: 'block', textAlign: 'center',
                    background: '#F97316', borderRadius: '10px',
                    padding: '13px 24px',
                    fontFamily: 'var(--font-mono)', fontWeight: 700,
                    fontSize: '14px', color: 'hsl(240 14% 4%)',
                    textDecoration: 'none',
                  }}
                >
                  Start Free Audit →
                </a>
              )}

              {/* Done */}
              {inputPhase === 'done' && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(240 8% 35%)', margin: 0, textAlign: 'center' }}>
                  // We'll be in touch
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
