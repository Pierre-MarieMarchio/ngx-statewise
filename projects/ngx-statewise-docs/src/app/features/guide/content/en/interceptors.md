---
slug: interceptors
title:
  en: Interceptors
  fr: Interceptors
summary:
  en: Asking before an updater applies, and refusing the action.
  fr: Demander avant qu’un updater s’applique, et refuser l’action.
---

# Interceptors

An interceptor is asked **before** the updater of its action is applied, and it
may refuse the action. That is the whole of it: no state, no side effect, one
decision. Refusing is what the feature exists for, which in practice means
validation, and confirmation before something destructive.

It is the only step of a dispatch that runs ahead of the state, so the flow
reads action → interceptor → updater → effect. An interceptor is synchronous,
which is what leaves everything after it as it was: the state is still settled
before [effects](/guide/effects) run.

## Declaring an interceptor

`createInterceptor` needs an injection context and nothing else, exactly like
[`createEffect`](/guide/effects#registering-effects). Declare it in a class the
application instantiates:

<!-- prettier-ignore -->
```typescript title="tally.guard.ts"
import { inject, Injectable } from '@angular/core';
import { createInterceptor } from 'ngx-statewise';

import { tallyActions } from './tally.action';
import { TallyState } from './tally.state';

/** The most this tally is allowed to reach. */
export const TALLY_CEILING = 20;

@Injectable()
export class TallyGuard {
  private readonly tallyState = inject(TallyState);

  private readonly onIncrement = createInterceptor(
    tallyActions.incremented,
    (step) => this.tallyState.total + step <= TALLY_CEILING,
  );
}
```

That is [the showcase's](/guide/showcase#state) `TallyGuard`, in full. `tallyActions.incremented`
carries a `number`, so `step` is one: the handler's parameter is inferred from
the action creator. An action carrying nothing gives the handler one parameter
typed `undefined`, and leaving it out is the usual form.

Only `false` refuses. Returning nothing — which is what a handler with no
return statement does — lets the action through, so an interceptor that only
wants to look at what passes reads the same as one that decides. A verdict is
`boolean | void`, and nothing widens it: returning the payload, or a count, is
a compile error rather than a truthy pass.

Several interceptors may guard one action. They all run, in registration order,
and asking stops at the first refusal, since once the decision is made there is
nothing left for the others to decide.

## Registering the class

List the class under `interceptors`, so Angular instantiates it at startup and
its declarations register:

```typescript title="app.config.ts"
provideStatewise({
  effects: [AuthEffect, TaskEffect, ProjectEffect],
  interceptors: [TallyGuard],
});
```

That option exists so that a class holding no effect is not listed as one. How
it relates to `effects` is in
[Getting started](/guide/getting-started#setting-up-your-application).

A class that already exists for another reason needs no entry there. A manager,
an effect class listed under `effects`, or a component all provide the
injection context, and the registration then lasts as long as that injector, so
an interceptor declared in a component dies with it. That is the
[lifecycle](/guide/effects#lifecycle) an effect registration has.

`createInterceptor` returns an `InterceptorRef` for the rarer case where you
need to stop earlier. Ignoring the handle is fine: destroying the owning
injector already unregisters the interceptor.

## What a refusal costs

A refused action does **nothing**:

- no updater is applied,
- no effect is started,
- nothing is recorded in the [action history](/guide/api#actionhistory), since
  the history shows what changed the state, and an entry whose effect is
  nowhere to be found would be worse than no entry,
- `dispatchAsync` **resolves**, because a refusal is an expected outcome and
  not a failure. Rejecting would force a `try`/`catch` around intended
  behaviour,
- nothing reaches Angular's `ErrorHandler`, for the same reason.

The caller therefore does not learn that it was refused: `dispatch` returns
`void`, and `dispatchAsync` resolves either way. That is deliberate, and it is
the right shape for the case interceptors exist for. The interceptor asked, the
answer was no, the state did not move. Making `dispatchAsync` return
`Promise<boolean>` would change [`Statewise`](/guide/api#statewise) and push
that boolean through every manager in the application.

An updater that clamps looks similar from the outside and is not the same
thing: a clamp records something that did not happen, while a refusal records
nothing.

One thing a refusal does not undo. The runs this action was told to abandon,
through an effect's [`cancelOn`](/guide/effects#cancelon), are abandoned before
any interceptor is asked. A refusal stops what the action would start, not what
it was told to stop.

## Synchronous, and with no options

An interceptor handler is synchronous. An `async` handler is a compile error,
and the reason is the one that makes an [updater](/guide/updaters#typing)
synchronous too: everything the library guarantees rests on the dispatch being
a synchronous step. The state is settled before effects run, `dispatch()`
applies its updater immediately, an updater failure throws at the call site,
and two successive dispatches apply their updaters in call order. A decision
awaited elsewhere would cost all four.

An interceptor also does not dispatch an upstream action. Nothing in the types
stops you; the guarantee is what stops you. Dispatching one would apply its
updater synchronously while starting its effects asynchronously, so "before"
would hold for the state and not for the effects, and a guarantee that cannot
be stated honestly has no place here. An interceptor that wants to trigger
something calls a manager, which is what
[crossing a feature boundary](/guide/managers#crossing-a-feature-boundary)
prescribes anyway.

And it takes **no options**: no `concurrency`, no `cancelOn`, no `mustAnswer`,
no `key`, no `abortSignal`. Those
[govern the runs of an effect](/guide/effects#governing-the-runs), and an
interceptor starts no run, so there is nothing to cancel, nothing to supersede,
nothing to await.

## What it does not do

- It does not run on a
  [misrouted dispatch](/guide/updaters#dispatching-through-the-right-manager).
  Nothing of that action belongs to that scope, its decision included.
- It has no scope of its own. An interceptor guards an action type
  application-wide, whichever manager dispatches it, like an effect and unlike
  an updater.
- It is not an Angular `HttpInterceptor`. The two share a name and nothing
  else: this one is asked about an action before its updater, the other sees an
  HTTP request on its way out.

An interceptor that throws is a programming error and is treated as one. It
escapes synchronously at the call site, exactly like an updater that throws.

## Key notes

- Asked before the updater, and only `false` refuses. A handler with no return
  statement lets the action through.
- Synchronous, with no options and no scope of its own.
- A refused action leaves nothing behind, and the dispatch resolves all the
  same.
- Declare the class in `provideStatewise({ interceptors: [...] })`, unless
  something else already instantiates it.

Next: [Managers](/guide/managers).
