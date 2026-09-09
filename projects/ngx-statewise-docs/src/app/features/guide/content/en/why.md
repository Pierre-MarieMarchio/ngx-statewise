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

## What the design buys you

- **One way through.** Action → updater → effect → possibly more actions, always
  in that order. When state is wrong, only one place could have written it.
- **State settled before side effects.** An updater is synchronous and finishes
  first, so no effect reads stale state.
- **Signals, not subscriptions.** State is signals all the way to the template.
  Components re-render when they read a value, and there is nothing to
  unsubscribe.
- **Cascades you can await.** `dispatchAsync` resolves when the whole chain is
  over, nested effects included. A flow like "log in, then load, then navigate"
  reads as one call instead of a tree of callbacks.
- **Mistakes that surface.** A duplicate updater is reported at startup. A
  dispatch aimed at the wrong manager throws in development. A failing effect
  reaches your `ErrorHandler`.
- **Little to write.** A feature is a state class, an action group, an updater
  and a manager. No reducer switch, no selector file, no module.

## When it fits

- **You are already on signals.** New applications, or ones moving off
  Observable-based state.
- **Your flows are sequential.** One step has to finish before the next runs,
  with consistent state throughout. A cascade handles that.
- **You want structure without a framework.** Medium to large applications that
  need conventions everyone follows, without a whole architecture to learn.

## When it does not

- **You need one serialisable state tree**, for time-travel debugging or for
  replaying sessions. State here is spread across injectables.
- **You compose derived state heavily.** `computed` covers a lot, but there is
  no selector layer with memoised composition and parametrised selectors.
- **You react to streams rather than to intent.** If websockets or long-lived
  observables drive your state more than user actions do, an Observable-first
  library suits you better.
