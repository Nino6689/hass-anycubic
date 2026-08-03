# Security policy

This is the maintained continuation of Anycubic support for Home Assistant. Security reports belong
**here** — the original project has been dormant since December 2024, so sending them upstream means
nobody answers.

Scope is this integration and the two packages it ships: `anycubic-cloud-api` and
`anycubic-cloud-frontend`. Anycubic's own cloud service and printer firmware are theirs, not mine —
but if you find something in how *this* integration talks to either, that is in scope and I want to
hear about it.

## Reporting a vulnerability

Please use a **private security advisory** via the [Security tab](https://github.com/Nino6689/hass-anycubic/security/advisories/new)
rather than a public issue, so there is time to ship a fix first.

Include what you did, what happened, and the integration version. A proof of concept helps but is
not required — a clear description of the problem is enough to act on.

I maintain this in my own time and cannot promise a response window, but I will acknowledge a report
and tell you honestly what I can and cannot fix. Anything that turns out to be Anycubic's rather
than mine, I will say so plainly rather than sit on it.

## What is already known

Being upfront about the deliberate trade-offs, so nobody wastes time reporting them as findings:

| | |
|---|---|
| **Cloud connection** | Fully verified TLS against Anycubic's pinned root CA. Two relaxations are unavoidable and documented in the README's [Security](https://github.com/Nino6689/hass-anycubic#-security) section: their client certificate is SHA-1 signed, and their root CA omits the `keyUsage` extension |
| **Broker certificate has no SAN** | It works today via OpenSSL's deprecated CN fallback. If that is removed, the cloud connection breaks and will need revisiting. Tracked in the roadmap |
| **Local (LAN Mode) connection** | Encrypted but **not verified**. The printer signs its own certificate for an address that differs per unit, so there is nothing to verify it against. It never leaves your network. This is the same trade Home Assistant makes for every local device that ships its own certificate |
| **Local credentials** | Obtained per session from the printer, held in memory, never written to disk. They are rotated by the printer and are meaningless off your own network |
| **MD5 in the local handshake** | The printer's firmware chooses it, not this integration. It signs a request that only ever travels across your own network |

## Tokens

Your Anycubic auth token is stored by Home Assistant in `.storage/core.config_entries` on the HA
host, alongside every other integration's credentials. Treat that file as sensitive.

**Do not paste it into an issue.** The diagnostics download (device page → ⋮ → *Download
diagnostics*) is redacted automatically and is the safe thing to attach.

Tokens are 90-day JWTs that cannot be renewed automatically. The integration warns you before one
lapses rather than letting it fail silently.

## Credit

The original project is [@WaresWichall](https://github.com/WaresWichall/hass-anycubic_cloud)'s work,
and this exists to keep it going.
