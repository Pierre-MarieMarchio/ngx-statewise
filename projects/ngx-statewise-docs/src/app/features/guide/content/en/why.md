---
slug: why
title:
  en: Why ngx-statewise
  fr: Pourquoi ngx-statewise
  es: Por qué ngx-statewise
  de: Warum ngx-statewise
  pt-BR: Por que ngx-statewise
summary:
  en: What the design buys you, and when it fits.
  fr: Ce que la conception apporte, et quand elle convient.
  es: Qué te aporta el diseño y cuándo encaja.
  de: Was der Entwurf dir bringt und wann er passt.
  pt-BR: O que o desenho te dá, e quando ele serve.
---

# Why ngx-statewise

What you get for accepting one rule about ordering, and the three cases where
you should reach for something else.

## What the design buys you

**One way through.** Action, updater, effect, possibly more actions, always in
that order. When a value is wrong, one place wrote it.

**State settled before side effects.** An updater is synchronous and finishes
first, so no effect reads stale state. This is the rule the rest is built on.

**Signals, not subscriptions.** State is signals all the way to the template.
Components re-render when they read a value, and there is nothing to
unsubscribe.

**Cascades you can await.** `dispatchAsync` resolves when the whole chain is
over, nested effects included:

```typescript
await this.auth.login(credentials);
// The login effect, the workspace it loaded and the navigation it triggered
// have all finished by here.
```

A flow like "log in, then load the workspace, then navigate" reads as one call
instead of a tree of callbacks.

**Mistakes that surface.** A duplicate updater is reported at startup. A
dispatch aimed at the wrong manager throws in development and reaches your
`ErrorHandler` in production. A failing effect does the same.

**Little to write.** A feature is a state class, an action group, an updater
and a manager. No reducer switch, no selector file, no module.

## When it fits

**You are already on signals.** New applications, or ones moving off
Observable-based state.

**Your flows are sequential.** One step has to finish before the next runs,
with consistent state throughout. A cascade handles that without you holding
the order in your head.

**You want structure without a framework.** Medium to large applications that
need conventions everyone follows, and cannot spend a week teaching them.

## When it does not

Three cases, and they are real. If you are in one of them, something else will
serve you better.

**You need one serialisable state tree**, for time-travel debugging or for
replaying a session. State here is spread across injectables, and no single
object holds it.

**You compose derived state heavily.** `computed` covers a lot, but there is no
selector layer with memoised composition and parametrised selectors. If your
application is mostly derivations of derivations, you will miss it.

**You react to streams rather than to intent.** If websockets or long-lived
observables drive your state more than your users do, an Observable-first
library suits you better. An effect reads one emission and stops listening —
that is a deliberate limit, not an oversight.

> [!NOTE]
> None of these is a performance argument. The library does almost nothing at
> runtime; if it is the wrong fit, it is because of the shape above, not the
> cost.

Next: [Getting started](/guide/getting-started).
