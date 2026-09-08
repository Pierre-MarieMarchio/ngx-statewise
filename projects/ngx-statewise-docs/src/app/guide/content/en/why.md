# Why ngx-statewise

## What the design buys you

- **One way through.** Action → updater → effect → possibly more actions, always
  in that order. When state is wrong, there is exactly one place it could have
  been written.
- **State settled before side effects.** An updater is synchronous and finishes
  first, so no effect ever reads state from a moment ago.
- **Signals, not subscriptions.** State is signals all the way to the template.
  Nothing to unsubscribe, and components re-render because they read a value,
  not because someone remembered to push one.
- **Cascades you can await.** `dispatchAsync` resolves when the whole chain is
  over, nested effects included. Flows like "log in, then load, then navigate"
  read as one call instead of a tree of callbacks.
- **Mistakes that surface.** A duplicate updater is reported at startup. A
  dispatch aimed at the wrong manager throws in development. A failing effect
  reaches your `ErrorHandler` instead of vanishing into an unobserved promise.
- **Little to write.** A feature is a state class, an action group, an updater
  and a manager. No reducer switch, no selector file, no module.

## When it fits

- **You are already on signals.** New applications, or ones moving off
  Observable-based state. This is where the library is at home.
- **Your flows are sequential.** One thing has to finish, then the next, and
  state has to be consistent throughout. That is what the cascade is for.
- **You want structure without a framework.** Medium to large applications that
  need conventions everyone follows, but not a whole architecture to learn.

## When it does not

- **You need one serialisable state tree**, for time-travel debugging or for
  replaying sessions. State here is spread across injectables on purpose.
- **You compose derived state heavily.** `computed` covers a lot, but there is
  no selector layer with memoised composition and parametrised selectors.
- **You react to streams rather than to intent.** If your state is driven by
  websockets or long-lived observables more than by user actions, an
  Observable-first library will fight you less.
