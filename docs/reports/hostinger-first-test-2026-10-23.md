# First genuine Hostinger Test — forensic record

## Exact displayed contract reconciliation — 2026-10-23

Marcel supplied the complete UI example. BEFORE changing the route, the exact sample with
synthetic Bearer auth reproduced400/validation/wrong_mailbox and no storage. This is payload
mailbox validation, NOT the later database account lookup. Thus it is fully consistent with
the original production400-before-storage trace. Original wire bytes were not retained;
do not claim they are proven identical to the displayed example.

Field comparison against the actual strict parser:

| Field | Local result |
| --- | --- |
| delivery UUID, event, opaque eventId | Accepted unchanged |
| timestamp with six fractional digits | Accepted; normalized independently to milliseconds |
| mailboxAddress test@hostinger.com | FIRST rejection wrong_mailbox against info@maxpromo.digital |
| Message-Id, In-Reply-To, References | Valid; empty reply/header alternatives still supported |
| Date with two spaces after comma | Accepted independently as2026-04-03T06:21:33Z |
| from/to/cc, subject, plainBody, empty htmlBody | Valid shapes; display names remain non-authoritative |
| attachment name/type/sizeBytes | Valid; MIME remains untrusted metadata |
| attachment fileUrl https://download-url | Independently rejected invalid_signed_content: single-label placeholder host |
| bodyUrl https://download-url | Independently rejected after fixing attachment URL locally; same reason |
| unknown/missing fields | Strict connectivity match rejects either; existing real-mail parser unchanged |

Only mailbox and URL candidates were changed in successive LOCAL clones to prove remaining
fields parse. Neither production validation nor URL policy was weakened. Documentation
annotations were not treated as transmitted comments; JSON parsing remains strict.

Compatibility: only the complete exact public sample, all keys/values/array order, with no
extra fields, is recognized as connectivity traffic. Object key order is irrelevant.
It passes existing Bearer, rate/size/JSON and provider/session-config gates, then returns
200 {ok:true,test:true}/no-store without opening DB, invoking ingestion, sealing URLs,
creating mail/audit/business records, downloading, modeling or notifying. Repeats are
stateless acknowledgements; real event dedupe remains untouched. Any changed ID, timestamp,
address, content, URL, array or extra field falls through to the normal strict parser.
This deliberately does not guess a broader/dynamic Test contract.

Verification: full verify29 gates, email202 checks (38 native/59 actual route), isolated
SQL40, explicit TypeScript pass, lint/build pass. Every sample leaf was mutated and refused;
repeated Test acknowledgements opened storage0 times; missing/wrong auth401, missing
provider/session503, tampered sample/wrong-mailbox real events400. Real message concurrency/
retry, unsafe URLs and prior adversarial checks remain intact. Four safety mutations caught,
including intentionally replacing the exact detector with unconditional true. Initial
TypeScript narrowing and mutation-harness import issues were fixed and the full suite rerun.

Deployed850b42766f5b7bd958c1611cdaaf359d53c4e67b through normal main/Git production release:
dpl_6ntgsvX8ze3LjmiAiZjwhxsLHUbK, Ready/Production, created2026-10-23 11:27:19 Europe/Berlin,
https://maxpromo-digital-oui0x53uh-buddy1974s-projects.vercel.app. www.maxpromo.digital points
to it; health reports850b427. Actual GET/HEAD405, unauthenticated/Basic/wrong-Bearer POST401,
OS/Inbox/client/Angebot/Rechnung200, EN/DE homepages200 and health ok. Inbox configured:true,
threads0. Read-only production SQL after deployment: accounts1/matches1/enabled true;
messages/events/deliveries/actions/jobs0. WhatsApp503/unconfigured/OFF. No Hostinger contact,
Test, secret use, real-mail write/send/fetch, downloads or Telegram permission change.

Another owner Test is justified for this explicitly supported sample; it is not proof of
real-message ingestion or full content. SAFE TO RETRY HOSTINGER TEST.
**Supersedes the earlier retry blocker below.** Agent never uses production secret/Test.

The owner reported Hostinger's active info@maxpromo.digital / message.received Test
returned400. No agent repeated Test, used the genuine Bearer token or contacted Hostinger.

## Retained production evidence

Vercel serverless request records on dpl_3eb5eCWCpihA87C9XkLdyzrPE59b:

| UTC | Request ID | Route | Status |
| --- | --- | --- | --- |
| 2026-10-23 05:35:25.349 | bzfkj-1792733725349-6b09659560d3 | POST /api/channels/mail | 400 |
| 2026-10-23 05:35:40.539 | 2c8bk-1792733740539-92a968d902e3 | POST /api/channels/mail | 400 |

These are the new400 records corresponding to the owner's reported Test window; earlier
known agent probes returned401/405. Both new requests reached the actual serverless route.
No request body, response body or diagnostic message was retained. The original400 body
cannot be recovered from these logs; do not falsely label it invalid_event or wrong_mailbox.

The deployed handler returns400 only after strict Bearer authentication, in body decoding
or JSON/schema validation. Oversize is413, authentication/configured-secret failure401,
provider/session/database/account failures503, rate limit429. Middleware excludes this
API route. Thus authentication passed; rejection occurred before getDb/account acceptance.
No evidence of firewall/proxy failure, timeout or database failure caused these responses.
The exact rejected field and whether Test differs from message.received remain UNKNOWN.
Do not blame/rotate the secret or relax mailbox validation from this evidence.

Read-only production SQL after Test: one enabled hostinger:info@maxpromo.digital binding,
one matching mailbox, acceptance predicate true. Messages/events/deliveries/actions/jobs0.
Owner Inbox200/configured:true/threads0; public GET405/HEAD405, unauthenticated/Basic/wrong
Bearer POST401; OS/client/quotation/invoice200; homepages200, health200/ok; WhatsApp503/OFF.
No fake inbox email, provider-test audit row, lead or outbound action was created.

## Locally justified repair

The evidenced observability gap is fixed without changing acceptance rules: rejected
authenticated requests emit only mail.webhook.rejected plus fixed stage/reason codes.
JSON parsing is diagnosed separately. Unknown exceptions map to a fixed invalid_event code;
no raw exception/request, addresses, bodies, headers, signed URLs or secret values logged.
No authentication, event/mailbox schema, dedupe/threading, storage, download or owner
permission was relaxed. This diagnostic repair does NOT prove a provider compatibility fix.

Verification: full verify29 gates passed (typecheck/lint/build/channel/WhatsApp/security
regressions), email185 including actual route46, isolated evidence SQL40. Deliberately
adding a payload field to the diagnostic log failed the real route proof; source restored,
route46 passed again. Existing auth/mailbox/evidence mutations remain caught. No real model,
provider transport or production fixture was used by these proofs.

Released diagnostic commit9bffeab87a7872a0c57945aa474127d4501d520a through normal main/Git
deployment dpl_3dEo92YhvcJRK1anW4SUPyDScmWZ, Production/Ready, created07:42:26 Europe/Berlin.
www.maxpromo.digital resolves to it; public health reports9bffeab. Post-release public
405/401, owner OS/Inbox/documents200, homepages200 and health ok verified again. Refreshed
production counts remain0 with exactly one enabled account. No further provider400/retry
appeared in the inspected window; only the original two have been retained. The diagnostic
release cannot retroactively reconstruct either old payload or its response body.

Pending external evidence: redacted JSON/response detail from the failed Hostinger delivery,
without Authorization, secrets, personal contents or signed URL query values. Do not press
Test again merely to guess. A legitimate provider-test contract, if different, must be
identified before adding an explicit no-business-write connectivity path.

**DO NOT RETRY HOSTINGER TEST** until the actual Test contract/rejection is resolved.
