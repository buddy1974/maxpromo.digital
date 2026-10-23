# ADR-0020 — Email is a governed OS channel

Status: implemented locally; production activation not approved. 2026-10-22.

Email is a governed Maxpromo communication channel. The provider transports mail.
Maxpromo OS owns business context. Max Agents owns intelligence. Telegram provides owner control.

## Decision

The existing web/OS deployment hosts `lib/mail`, `/api/channels/mail`, and the
authenticated `/os/inbox` module. The commercial registry supplies owner capabilities
through the existing signed agent API. No second Telegram bot, database connection
resolver, commercial approval engine, or notice queue is introduced.

Inbound email is external untrusted data, including sender names and From addresses.
It never enters the public WhatsApp tool lane or authorizes an owner capability.
Sender email relationships are possible matches until the owner confirms them.
No subject-only thread merging is permitted. Account identity namespaces provider IDs.

The provider-neutral interface isolates Hostinger REST calls. MCP is excluded from
runtime. The Hostinger adapter needs an explicitly supplied transport and activation
gates; evidence mode blocks it before the transport. Existing Resend delivery of
Angebote/Rechnungen stays staged on its existing boundary until Hostinger is proven.

GREEN permits read/search/draft and internal state. AMBER sends/trashes only an exact
prepared payload through the existing engine. Permanent delete is not offered. Email
text cannot execute tools, expose secrets, alter security or authorize commitments.

## Contract reconciliation and activation boundary — 2026-10-22

Marcel supplied the official message.received payload and identifier semantics.
The route now authenticates and bounds bytes, validates event and fixed mailbox, and
returns 200 only after atomic durable acceptance. Delivery id and mailbox eventId are
separate; eventId is not an IMAP UID or RFC Message-ID. Both are opaque bounded strings;
an empty eventId (Hostinger Test) is acknowledged without ingestion (decision-log 2026-10-23). Same-sender, uncontested RFC
reply/reference matches reconstruct threads; subject alone never merges them.

The two webhook body fields are previews (at most 200 characters), never authoritative
full text. Signed body/attachment locators are encrypted with a domain-separated key
derived from the existing session secret. Durable metadata, content jobs and private
storage-reference ports extend the existing channel. Download domains/body media shape
were not supplied: there is no live transport factory or automatic URL fetching.
Retrieval requires exact verified hosts, public pinned DNS, TLS hostname verification,
bounded responses and private durable storage; it remains blocked pending those facts.

Canonical route target is https://www.maxpromo.digital/api/channels/mail, derived from
the Domain Registry. Read-only HEAD on 2026-10-22 returned 404: the local route is not
deployed. No production activation is authorized by this reconciliation.

This ADR does not authorize configuration of a production webhook or migration.
Local test contracts are not represented as Hostinger webhook contracts.

## Consequences

One place owns business state and governance. A new provider replaces transport rather
than agents. Safe local functionality is usable/testable without mailbox access.
Live ingestion, body synchronization and owner mobile routing remain explicitly gated.
See [implementation and activation](../architecture/email-channel.md).
