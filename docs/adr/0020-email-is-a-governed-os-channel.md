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

## Fail-closed activation boundary

Official Hostinger documentation establishes Bearer-secret webhook authentication,
but not a complete event identity/body/retry contract. The route therefore authenticates
and bounds bytes, then returns 503; it does not parse, acknowledge or ingest mail.
The real fixture must establish how mailbox, folder, UID and threading references map
to durable account/message identity before activation. Provider folder UIDs must not
be mistaken for globally unique message IDs. Moves and UID validity resets need an
explicit synchronization strategy; RFC Message-ID alone is also attacker controlled.

This ADR does not authorize configuration of a production webhook or migration.
Local test contracts are not represented as Hostinger webhook contracts.

## Consequences

One place owns business state and governance. A new provider replaces transport rather
than agents. Safe local functionality is usable/testable without mailbox access.
Live ingestion, body synchronization and owner mobile routing remain explicitly gated.
See [implementation and activation](../architecture/email-channel.md).
