# First genuine Hostinger Test — forensic record

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

Pending external evidence: redacted JSON/response detail from the failed Hostinger delivery,
without Authorization, secrets, personal contents or signed URL query values. Do not press
Test again merely to guess. A legitimate provider-test contract, if different, must be
identified before adding an explicit no-business-write connectivity path.

**DO NOT RETRY HOSTINGER TEST** until the actual Test contract/rejection is resolved.
