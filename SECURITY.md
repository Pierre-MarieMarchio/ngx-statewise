# Security policy

## Reporting a vulnerability

**Do not open a public issue.** Use GitHub's private vulnerability reporting:

> [Report a vulnerability](https://github.com/Pierre-MarieMarchio/ngx-statewise/security/advisories/new)

That opens a private advisory only you and the maintainer can see, and it is
where the fix and the disclosure are coordinated from.

Please include the version of `ngx-statewise`, the version of `@angular/core`,
and the smallest reproduction you can manage. If you are unsure whether
something counts, report it — an over-report costs a reply, an under-report can
cost users.

You can expect an acknowledgement within a few days. This is a
single-maintainer project, so a fix may take longer than the acknowledgement;
you will be told which release is going to carry it.

## What is in scope

The published `ngx-statewise` package: its two entry points, `ngx-statewise`
and `ngx-statewise/testing`.

One thing worth knowing before you report it, because it is documented
behaviour rather than a defect: the action history keeps payloads **verbatim**.
If an action carries a password or a token, the recorded action holds it too.
The history is off unless a limit is configured
(`provideStatewise({ history: { limit: n } })`), and it lives in memory only —
it is never persisted or sent anywhere by the library. Feeding secrets through
action payloads and then enabling the history is an application decision, not a
library vulnerability.

## What is out of scope

- The showcase application in `projects/ngx-statewise-showcase`. It is a demo,
  it is `private`, it is never published, and its fake in-memory auth is
  deliberately not a real one.
- Advisories against development dependencies that cannot reach a consumer. The
  published package depends on `tslib` alone.

## Supported versions

Fixes land on the latest published version. There is no long-term support
branch, and versions below the current `latest` do not receive backports.

| Version             | Supported |
| ------------------- | --------- |
| latest `latest` tag | yes       |
| latest `beta` tag   | yes       |
| anything older      | no        |
