# Second genuine Hostinger Test — authoritative wire diagnostics

Located request875lg-1792750845538-f09330a94976 at2026-10-23T10:20:45.538Z,
POST /api/channels/mail, deployment dpl_6ntgsvX8ze3LjmiAiZjwhxsLHUbK, HTTP400.
Vercel retained the exact safe diagnostic:

    {"event":"mail.webhook.rejected","stage":"validation","reason":"invalid_event_id"}

Authentication passed. The exact public-example matcher did not match: otherwise the
parser could not have run. The parser had already accepted event=message.received,
delivery ID syntax and the data object. Its text guard also accepted eventId as a string
of at most256 UTF-16 units without NUL, then its identifier grammar rejected it. This is
the evidenced structural difference: actual eventId is not in the valid-ID class of the
documentation's example. Empty string and disallowed-character strings both produce this
code. Its actual length/character class was NOT retained; do not assert it was empty,
dynamic, a UUID, or a specific Test marker. No mailbox/address check or DB acceptance ran.

## Diagnostic repair, acceptance unchanged

No safe provider-Test discriminator is proven; no new acceptance path or ID relaxation.
Added authenticated-rejection-only versioned structural metadata: known field types/string
lengths, array lengths/element types, identifier validity/empty/character-category flags,
exact-matcher mismatch field paths, mailbox role (configured/documented_test/other), fixed
URL categories and types of known boolean Test markers. Unknown key NAMES are not logged;
only counts, preventing a malicious key name from becoming a content/credential log.
No raw values, headers, addresses, subjects, text, filenames, hostnames, URLs/query values,
exception text or credentials. Output is bounded below4096 bytes for the tested worst-case
known structure; traversal follows fixed expected fields/slots, not arbitrary payload depth.
No network, DNS, database, model, notice, business action or content download is reachable.
Existing Bearer/size/event/mailbox/dedupe/threading/SSRF and exact-fixture rules unchanged.

Local reproductions cover the actual evidenced invalid-event-id CLASS using synthetic
empty/space/slash/at-sign variants; these are not claims about unseen production values.
They retain400 and open the database0 times. Metadata distinguishes those variants and all
known sample mismatch fields. Full verify29 gates passed; email213 checks (native40,
actual route67), evidence storage40; explicit TypeScript, lint/build and affected security/
WhatsApp/commercial-boundary regressions pass. Five safety mutations caught, including
overly broad connectivity recognition and intentionally returning raw payload in diagnostics.

Next provider request will distinguish empty/nonempty invalid-format event IDs, expose
all known-field structural mismatches, and classify URLs without their values. It may still
return400: this is a decisive structural investigation, not a claim of compatibility or a
guaranteed200. If no safe Test discriminator emerges, keep rejecting and require provider
contract evidence rather than treating arbitrary wrong-mailbox messages as connectivity.
No agent Hostinger contact/Test/secret use/send/fetch or environment/permission change.

## Verified production release

Application c1bab755c9f93b950922bf90611e0524ce689fd9, deployment
dpl_CUufN295SyNCE1cefW2ZvRNhs2TJ, created2026-10-23 12:34:10 Europe/Berlin,
Ready/Production, https://maxpromo-digital-n6kwsw9kw-buddy1974s-projects.vercel.app.
www.maxpromo.digital resolves to this deployment; public health reportsc1bab75.
Actual public GET405/HEAD405; unauthenticated/Basic/wrong-Bearer POST401. Authenticated
OS/Inbox/client/Angebot/Rechnung200; EN/DE homepages200, health200/ok; Inbox configured:true,
threads0. Read-only production counts after release: accounts1/matches1/enabled true;
messages/events/deliveries/actions/jobs0. WhatsApp503/unconfigured/OFF. No audit-only rows
or fake mail introduced. No secret use/rotation, Hostinger contact/Test or other activation.

SAFE TO RETRY HOSTINGER TEST for one decisive structural diagnostic request. This is NOT
a promise of200: acceptance is unchanged until a safe real-wire Test discriminator is proven.
