# ngx-statewise

A lightweight and intuitive state management library for Angular.

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Getting Started](#getting-started)
- [Key Concepts](#key-concepts)
  - [1. States](#1-states)
  - [2. Actions](#2-actions)
  - [3. Updaters](#3-updaters)
  - [4. Effects](#4-effects)
  - [5. Managers](#5-managers)
- [Testing](#testing)
- [Migrating from 0.6.x](#migrating-from-06x)
- [Benefits](#benefits)
- [When to Use ngx-statewise](#when-to-use-ngx-statewise)
- [Contributing](#contributing)
- [License](#license)

## Description

ngx-statewise is a state management solution for Angular applications, providing a more lightweight and intuitive alternative to libraries like NgRx and NGXS, while maintaining a clear and predictable architecture for managing your application's state.

Unlike NgRx, which is built around observables and actions dispatched through a store, or NGXS, which uses a Redux-like approach with actions and state mutations, ngx-statewise leverages Angular's native signals for a more declarative and reactive state management experience. Signals allow for automatic component updates when the state changes, making it easier and more efficient to manage reactive data in your Angular applications.

While NgRx and NGXS are powerful solutions, they tend to be more complex and require developers to work with higher levels of boilerplate code. On the other hand, ngx-statewise offers a more streamlined approach that integrates seamlessly with Angular's ecosystem, allowing developers to focus on business logic rather than infrastructure.

## Core Concept

The core concept of ngx-statewise revolves around a clear, predictable flow of actions and state updates:

- **Action with Payload**: Everything starts with an action that carries a payload with the necessary data.

- **Manager Dispatches Action**: The manager dispatches this action, which triggers the appropriate updater.

- **Updater Updates State When Registered**: If an updater handles the action, it modifies the state before effects run. Effect-only actions are also valid.

- **Effect Handles Side Effects**: After the state is updated, any related effect is triggered to handle side operations (like API calls).

- **Chain of Actions**: Effects can dispatch additional actions, which in turn can trigger other updaters and effects, creating a chain of operations if needed.

### Paradigm Shift

While NgRx and NGXS implement state management based on redux-style patterns with stores, reducers, and selectors, ngx-statewise introduces a paradigm shift:

- **Direct Action Flow**: Instead of actions going through a centralized store, actions are directly linked to their updaters and effects, making the flow more intuitive.

- **Signals over Observables**: Rather than relying heavily on RxJS observables for everything, ngx-statewise leverages Angular's native signals for state reactivity.

- **Explicit Separation**: The library enforces a clear distinction between state updates (updaters) and side effects, making the codebase easier to maintain.

- **Simplified Boilerplate**: The amount of code required to implement state management is significantly reduced compared to NgRx or NGXS.

The unidirectional flow (Action → optional Updater → Effect → Potentially More Actions) in ngx-statewise makes state management predictable and easier to debug. When an updater handles an action, its state update is completed before effects execute. Actions without an updater are valid when they exist only to trigger effects.

### Considerations

- **Complex Queries**: For extremely complex state derivation and selection patterns, the built-in capabilities might need to be extended.

- **Action-First Approach**: Unlike some libraries where effects can be triggered independently, ngx-statewise requires an action to be dispatched first, which then updates state before triggering effects. This enforces a specific flow that might require adjustment in thinking if coming from other patterns.

It's important to note that while ngx-statewise supports dispatching individual actions, its primary design intention is to leverage cascading effects - where one action triggers an updater, which leads to an effect, which may then dispatch additional actions, creating powerful chains of operations. This design philosophy particularly shines in complex applications with interconnected state changes and sequential operations.

The clear, unidirectional flow with emphasis on cascading effects makes ngx-statewise particularly well-suited for applications where predictable state updates need to trigger complex chains of operations, especially when these operations need to be executed in a specific order while maintaining state consistency throughout the process.

## Features

- 🔄 Flexible state management: Supports Angular signals for automatic reactivity and updates. You can also use regular properties if you prefer manual reactivity.
- 🧩 Modular and maintainable architecture: Easily extendable with actions, effects, and handlers.
- 📦 Predictable state updates: Updates are dispatched through actions, with clear and explicit state mutations.
- 🚀 Effects: Handles asynchronous operations and side effects in a clean and declarative way.
- 🔍 Easy to debug: State changes and effects are transparent and easy to track.

## Getting Started

### Installation

```bash
npm install ngx-statewise
```

### Setup in your Angular Application

To use ngx-statewise, add `provideStatewise()` to your application's providers. It is the single entry point of the library: it wires the execution engine and registers your effects and your global updaters.

```typescript
import { provideStatewise } from 'ngx-statewise';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStatewise({
      effects: [AuthEffect, UserEffect],
    }),
    // other providers
  ],
};
```

`provideStatewise` accepts four optional options:

| Option              | Type                              | Description                                                                                                          |
| ------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `effects`           | `Type<unknown>[]`                 | Effect classes, instantiated eagerly so their effects are registered at startup.                                     |
| `updaters`          | `Updater<unknown>[]`              | Updaters available application-wide, whichever manager dispatches.                                                   |
| `history`           | `{ limit: number }`               | Records the last `limit` actions. Disabled by default; `limit` must be a positive integer.                           |
| `misroutedDispatch` | `'throw' \| 'report' \| 'ignore'` | What a dispatch reaching the wrong manager does. Throws in development, reports to the `ErrorHandler` in production. |

## Key Concepts

### 1. States

States represent the current state of your application or a specific feature. They can be defined using Angular signals for reactivity, or as regular properties for manual reactivity.

#### Using Angular signals:

Signals are the recommended approach as they automatically trigger component updates when state changes. Here's an example of how you can define state using signals:

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthStates {
  public user = signal<User | null>(null);
  public isLoggedIn = signal(false);
  public isLoading = signal(false);
  public asError = signal(false);
}
```

#### Using regular properties

You can still define state as regular properties if you prefer not to use signals. However, you will need to manually update your components when the state changes. Signals make state updates automatic and reactive, which simplifies component reactivity.

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthStates {
  public user: User | null = null;
  public accessToken: string | null = null;
  public isLoggedIn = false;
  public isLoading = false;
  public hasError = false;
}
```

#### Key Notes

- Signals are reactive and recommended for most use cases. Components will auto-update when signal values change.

- Regular properties require manual component updates.

- You can mix both in the same state class depending on your needs.

- Signals simplify reasoning about UI updates and reduce boilerplate in Angular components.

### 2. Actions

Actions are events that trigger state changes. In ngx-statewise, actions can be defined individually or grouped together for specific event flows. Each action typically includes a type (an event identifier) and optionally a payload.

In ngx-statewise, actions are defined in a flexible and organized way, using both single actions and action groups. Action groups provide a powerful mechanism for managing related actions, while single actions are useful for standalone operations. Both are automatically typed and can include payloads when necessary. By organizing actions this way, we ensure that the state management process remains clear and predictable.

#### Action Group

When using defineActionsGroup, action types are automatically created by combining the source (a base name) and event name. This is useful when dealing with a set of related actions, such as loading states or error handling, allowing you to organize actions under a common source.

For example, with a source of 'LOGIN', events like 'request' will automatically become 'LOGIN_REQUEST', 'success' will become 'LOGIN_SUCCESS', and so on.

Here's an example of how you would define a group of related actions:

```typescript
import { defineActionsGroup, payload, emptyPayload } from 'ngx-statewise';

export const loginActions = defineActionsGroup({
  source: 'LOGIN',
  events: {
    request: payload<LoginSubmit>(), // Becomes LOGIN_REQUEST
    success: payload<LoginResponse>(), // Becomes LOGIN_SUCCESS
    failure: emptyPayload, // Becomes LOGIN_FAILURE
    cancel: emptyPayload, // Becomes LOGIN_CANCEL
    retry: payload<number>(), // Becomes LOGIN_RETRY
  },
});
```

In the above example:

- The `LOGIN_REQUEST` action will be triggered when a login request is made, with a payload of type `LoginSubmit`.
- The `LOGIN_SUCCESS` action will be triggered when the login operation succeeds, with a payload of type `LoginResponse`.
- The `LOGIN_FAILURE`, `LOGIN_CANCEL`, actions don't require payloads, so they are defined with emptyPayload.
- `LOGIN_CANCEL` only cancels something if an effect declares it through `cancelOn` — see [Concurrency](#concurrency). Declared on its own, it is an ordinary action like any other.

#### Single Action

For single actions that do not require grouping, you can use defineSingleAction. These actions will automatically be suffixed with `_ACTION` to ensure their uniqueness.

For example, `'LOGOUT'` becomes `'LOGOUT_ACTION'`, and `'SELECT_ITEM'` becomes `'SELECT_ITEM_ACTION'`. Here's how you define them:

```typescript
import { defineSingleAction, emptyPayload, payload } from 'ngx-statewise';

export const logoutAction = defineSingleAction('LOGOUT', emptyPayload); // Becomes LOGOUT_ACTION
export const selectItemAction = defineSingleAction('SELECT_ITEM', payload<number>()); // Becomes SELECT_ITEM_ACTION
```

In this case:

- The `LOGOUT_ACTION` will be dispatched when the user logs out, with no payload, as indicated by `emptyPayload`.
- The `SELECT_ITEM_ACTION` will be triggered when an item is selected, and the payload will be a number (likely the item ID).

`defineSingleAction` returns the creator itself, so it is used exactly like a creator coming from an action group:

```typescript
statewise.dispatch(logoutAction());
statewise.dispatch(selectItemAction(42));

on(logoutAction, (state) => { ... });
createEffect(selectItemAction, (id) => { ... });
```

#### Action Types

Each action (whether part of an action group or a single action) will have its own distinct type. These types are automatically generated based on the action's name and whether it's part of a group or standalone. This allows for clear and consistent action names throughout the application.

For example:

- The `loginActions.request` action will have the type `LOGIN_REQUEST`.
- The `logoutAction` will have the type `LOGOUT_ACTION`.

#### Key Notes

- Actions can be defined individually using `defineSingleAction` or as a group using `defineActionsGroup`, depending on the use case.

- Action types are automatically generated in a consistent and predictable way:

  - For grouped actions, a source like `LOGIN` combined with an event like request produces `LOGIN_REQUEST`.

  - For single actions, a name like `LOGOUT` becomes `LOGOUT_ACTION`.

- Action types are used as keys in updaters and effects, and they must match exactly.

- The `ofType(action)` helper ensures correct and type-safe usage when wiring actions into updaters or effects.

- Grouping related actions improves clarity and structure, especially for common flows like `request / success / failure`.

### 3. Updaters

Updaters describe how a state reacts to actions. They deal only with state data: anything else — API calls, navigation, logging — belongs in Effects.

An updater is declared with `defineUpdater`, outside of any class. It takes the injectable token holding the state, and a callback registering one handler per action.

```typescript
import { defineUpdater } from 'ngx-statewise';

export const authUpdater = defineUpdater(AuthStates, (on) => {
  on(loginActions.request, (state) => {
    state.isLoading.set(true);
    state.asError.set(false);
  });

  on(loginActions.success, (state, payload) => {
    state.user.set(payload.user);
    state.isLoggedIn.set(true);
    state.isLoading.set(false);
  });

  on(logoutAction, (state) => {
    state.user.set(null);
    state.isLoggedIn.set(false);
  });
});
```

The state is never resolved at declaration time: `defineUpdater` only records the token. The instance is read from the injector when the updater is attached to a manager, which is what keeps two managers of the same feature isolated from each other.

#### Typing

Handlers are fully inferred from the action creator, no annotation needed:

- `state` is typed by the token passed to `defineUpdater`.
- `payload` is typed by the action creator. An action without payload produces a handler with no second parameter.
- A handler must be synchronous. An `async` handler is a compile error, since state must be up to date before effects run.

```typescript
defineUpdater(AuthStates, (on) => {
  // ✅ payload is inferred as LoginResponse
  on(loginActions.success, (state, payload) => { ... });

  // ❌ compile error: this action carries no payload
  on(logoutAction, (state, payload) => { ... });

  // ❌ compile error: an updater handler must stay synchronous
  on(loginActions.request, async (state) => { ... });
});
```

#### Attaching updaters

##### To a manager

This is the usual case. The manager declares the updaters it owns via `injectStatewise`, and gets back the handle used to dispatch.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly statewise = injectStatewise(authUpdater);
}
```

The updaters passed this way are only visible to the dispatches issued through this handle. Two managers may declare the same action types on two different states without ever colliding.

##### Globally

An updater declared in `provideStatewise` applies to every dispatch, whichever manager issues it, when the dispatch scope does not itself handle the action type.

```typescript
provideStatewise({
  updaters: [authUpdater],
});
```

A scoped updater always wins over a global one for the same action type.

#### Dispatching through the right manager

An updater is only applied by the dispatches of the scope it is attached to. Sending an action to the wrong manager would therefore skip its state update, and that used to happen silently. It no longer does.

`defineUpdater` records the action types it claims as soon as its module is loaded. Dispatching one of those types through a scope that does not handle it throws in development:

```
[ngx-statewise] No updater in scope for "AUTH_LOADED". This action type is
handled by an updater attached to another injectStatewise() scope, so this
dispatch would silently skip its state update. Dispatch it through the manager
owning that updater, or declare that updater globally with
provideStatewise({ updaters: [...] }).
```

A misrouted dispatch does nothing at all: no state update, and none of the effects registered for that action type either. Those effects belong to whoever owns the updater, and running them here would cascade their actions into a scope that owns nothing of them.

In practice this means an effect must not return another feature's action. Inject that feature's manager and call it instead:

```typescript
public readonly loginSuccessEffect = createEffect(loginActions.success, () => {
  // ✅ each manager dispatches within its own scope
  this.projectManager.getAll();
  this.taskManager.getAll();

  // ❌ would throw: PROJECT_REQUEST belongs to the project manager
  // return getAllProjectsActions.request();
});
```

The check costs a set lookup and only runs when no updater matched. An action claimed by no updater at all stays perfectly valid — that is an effect-only action.

##### Development throws, production reports

The detection always runs; only the reaction depends on the environment. Throwing on a user's machine would take down a running application over a state update that is merely missing, so production hands the same error to Angular's `ErrorHandler` and carries on: the dispatch resolves, the effects of the action still run, and whatever you plugged into `ErrorHandler` — a logger, Sentry — receives the report.

Override it when you need to:

```typescript
provideStatewise({
  // 'throw' in development, 'report' in production.
  misroutedDispatch: 'report',
});
```

| Reaction   | Effect                                                        |
| ---------- | ------------------------------------------------------------- |
| `'throw'`  | Raises at the dispatch site. The default in development.      |
| `'report'` | Hands the error to `ErrorHandler`. The default in production. |
| `'ignore'` | Says nothing, as before the check existed.                    |

##### What the check cannot see

An action type becomes known when the module declaring its updater is loaded. In a lazily loaded feature, that happens with the chunk, so a dispatch aimed at an updater whose chunk has not been loaded yet is not reported.

This is a missed detection, never a false alarm: the check never blames a dispatch that would have worked. And when the chunk is absent, neither the updater nor the effects of that feature exist, so the action does nothing at all — which is the bug you were trying to catch in the first place.

If a lazily loaded feature must react to actions dispatched before it is reached, declare its updater globally instead of attaching it to a manager:

```typescript
provideStatewise({ updaters: [authUpdater] });
```

#### Key Notes

- One action type can only be handled by a single updater within the same scope. A duplicate is reported at startup, not silently ignored.
- Handlers mutate the state in place, typically through signals. They return nothing.
- An action handled by no updater is perfectly valid: it merely triggers its effects.

### 4. Effects

Effects are responsible for handling asynchronous operations such as API calls, navigation, or side effects that are not directly related to state updates. They are created using the `createEffect` utility function and are tied to specific actions.

A key architectural principle in ngx-statewise, _for now_, is that effects always run after state has been updated by an updater. This guarantees that effects operate on the most up-to-date application state. The sequence **Action → Updater → Effect** is enforced by design to ensure predictability and consistency across your application.

Effects can return other actions to trigger Updaters or even other effects, creating a chain of operations. This design promotes cascading effects, where an initial action triggers a state update, which then leads to one or more effects, each of which can dispatch further actions. Rather than encouraging isolated, standalone actions, ngx-statewise encourages sequences of operations, making complex workflows easier to orchestrate.

When creating effects, you must ensure that you don't return the input action directly as it can result in infinite loops. Instead, you should return new actions to trigger the corresponding state updates or other side effects.

Effects may return synchronous values, Promises, or Observables. Observable effects are intentionally one-shot: ngx-statewise consumes their first emission, then stops listening. Use an application-level subscription for long-lived streams.

#### Defining Effects with `createEffect`

The `createEffect` utility allows you to create an effect linked to a particular action. By default, it expects a Promise, but you can also return Observables within the effect.

Here's an example of an effect that uses a Promise:

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private readonly authRepository = inject(AuthRepositoryService);
  private readonly authTokenService = inject(AuthTokenService);
  private readonly router = inject(Router);

  /**
   * This effect listens to the LOGIN_REQUEST action and performs an asynchronous login operation.
   * It returns a Promise with either a success or failure action.
   */
  public readonly loginEffect = createEffect(
    loginActions.request, // Triggered by the LOGIN_REQUEST action
    async (payload) => {
      try {
        const res = await this.authRepository.login(payload);
        this.authTokenService.setAccessToken(res.body?.accessToken!);
        return loginActions.success(res.body!); // Success action
      } catch (error) {
        return loginActions.failure(); // Failure action on error
      }
    },
  );

  /**
   * This effect listens to the LOGOUT action and performs a simple navigation without returning any new actions.
   * It is an example of an effect returning an empty observable.
   */
  public readonly logoutEffect = createEffect(logoutAction, () => {
    this.router.navigate(['/']);
    return EMPTY; // No additional action needed after logout
  });
}
```

#### Effects with Observables

You can return an Observable for a one-shot asynchronous operation. Only its first emission is processed. An Observable that completes without emitting, such as `EMPTY`, is treated like an effect returning `void`.

Here’s an example of an effect using an Observable:

```typescript
@Injectable({
  providedIn: 'root',
})
export class UserEffects {
  private readonly userService = inject(UserService);

  /**
   * This effect listens to the GET_USER action and returns an Observable that emits either a success or failure action.
   */
  public readonly getUserEffect = createEffect(
    userActions.getUserRequest, // Triggered by the GET_USER_REQUEST action
    (payload) => {
      return this.userService.fetchUser(payload.userId).pipe(
        map((user) => userActions.getUserSuccess(user)), // Success action
        catchError(() => of(userActions.getUserFailure())), // Failure action on error
      );
    },
  );
}
```

In the example above, the effect listens for the GET_USER_REQUEST action and uses an Observable to handle the asynchronous operation of fetching user data.

#### Registering Effects

Effect classes must be declared in `provideStatewise` so Angular instantiates them at startup. `createEffect` registers itself in the injection context of the class that declares it, which is why the class must be instantiated for its effects to exist. Without this declaration, nothing happens when the action is dispatched.

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideStatewise({
      effects: [AuthEffects, UserEffects],
    }),
    // other providers
  ],
};
```

`createEffect` must be called in an injection context — as a field initializer or in the constructor of an injectable class. Calling it elsewhere throws immediately rather than registering an effect that would never run.

##### Scope

An effect runs for the dispatches of the manager owning its action's updater, and only those. Registration is application-wide, visibility is not: the owner of the updater owns the effects too.

```typescript
// AUTH_LOADED is handled by authUpdater, attached to AuthManager.
createEffect(authActions.loaded, () => { ... });

authManager.dispatch(authActions.loaded());   // ✅ the effect runs
taskManager.dispatch(authActions.loaded());   // ❌ misrouted: nothing runs
```

An action type no updater claims has no owner, so its effects run for every manager — that is an effect-only action, and it stays valid everywhere. An updater declared globally through `provideStatewise({ updaters: [...] })` is owned by every scope, so its effects run everywhere too.

##### Lifecycle

A registration lives as long as the injector that created it. An effect class scoped to a component or to a lazy route is unregistered when that injector is destroyed, instead of piling up one more copy of its effects on every instantiation.

`createEffect` returns an `EffectRef` for the rarer case where you need to stop an effect earlier:

```typescript
@Injectable()
export class AuthEffects {
  private readonly loginEffect = createEffect(loginActions.request, ...);

  public stopListening(): void {
    this.loginEffect.destroy();
  }
}
```

Ignoring the returned handle is perfectly fine: destruction of the owning injector already unregisters the effect.

#### Concurrency

By default, every dispatch starts its own run of the effect, and each answers when it answers. That is what you want most of the time, and it is what the engine has always done. It is not what you want when two runs write the same thing: the slow one answering last overwrites the fast one, and the state ends up holding the older intent.

A third parameter declares the policy governing the runs of an effect:

```typescript
public readonly updateTaskEffect = createEffect(
  updateTaskActions.request,
  async (task) => {
    const updated = await firstValueFrom(this.taskRepository.update(task));

    return updateTaskActions.success(updated);
  },
  { concurrency: 'latest', key: (task) => task.id },
);
```

| Policy       | While a run is in flight, a new dispatch…  |
| ------------ | ------------------------------------------ |
| `'parallel'` | starts its own run beside it. The default. |
| `'latest'`   | abandons that run and replaces it.         |
| `'first'`    | starts no run at all.                      |

##### What competes with what

Two runs compete only when they share all three of: the same effect, the same dispatch scope, and the same concurrency key. Two managers dispatching the same action never supersede one another, and neither do two effects registered on it.

The key is what makes `'latest'` usable on a list. Without one, every run of the effect competes, so moving a second card would abandon the write of the first. `key` derives it from the payload, one group per returned value:

```typescript
{ concurrency: 'latest', key: (task) => task.id }
```

##### What an abandoned run does

- Its `abortSignal` fires.
- A subscribed Observable is unsubscribed — which is what actually aborts an `HttpClient` request.
- The actions it was about to return are dropped. They never reach an updater.
- Its own failure is swallowed: nothing awaits the answer of a run that has been replaced.
- The `dispatchAsync` that started it resolves, without error. Its cascade is over; it simply produced nothing.

A promise cannot be cancelled, so the work behind one goes on regardless. What the policy guarantees is that its answer is dropped — and that the handler is told, so it can stop the work itself:

```typescript
public readonly searchEffect = createEffect(
  searchActions.request,
  async (term, { abortSignal }) => {
    const response = await fetch(`/api/search?q=${term}`, { signal: abortSignal });

    return searchActions.success(await response.json());
  },
  { concurrency: 'latest' },
);
```

The context comes after the payload. An action carrying no payload still has that first parameter — it is `undefined` — so its handler reads `(_, { abortSignal })`. One call shape covers every effect, which is why a handler written before the context existed still compiles untouched.

##### Cancelling explicitly

`cancelOn` names the actions that abandon the runs of an effect:

```typescript
public readonly loginEffect = createEffect(
  loginActions.request,
  async (credentials, { abortSignal }) => { ... },
  { cancelOn: loginActions.cancel },
);
```

Dispatching `loginActions.cancel()` then abandons the login in flight, with the same consequences as a supersession. Pass an array to name several cancelling actions.

Cancellation is scoped like dispatch: a manager abandons the runs it started, never another manager's. And it abandons every concurrency key of that effect at once — there is no per-key cancellation.

##### The state is not concerned

The policy governs effects, never state: the sequence **Action → Updater → Effect** is untouched. A dispatch that `'first'` holds back still goes through its updater, and so does the one superseding a run under `'latest'`.

So an `isLoading` raised by a request whose effect never ran is cleared by the answer of the run already in flight — under `'first'` there is exactly one answer coming, and under `'latest'` it is the newest run that answers.

#### Key Notes:

- Promises: Effects can return Promises for single asynchronous operations.

- Observables: Observable effects are one-shot. Only the first emission is processed; completion without an emission produces no action.

- Avoid Infinite Loops: Be careful not to return the input action from the effect (e.g., avoid returning the same action that triggered the effect). This can lead to infinite loops of action dispatching.

- Side Effects: Effects are designed for side effects like API calls, routing, or other asynchronous operations. They should not directly modify the state. That’s the role of Updaters.

- Scope: An effect only runs for the manager owning the updater of its action. Dispatching that action through another manager runs neither the updater nor the effect.

- Effect Registration: don't forget to declare your effect classes in `provideStatewise({ effects: [...] })` so they are instantiated and ready to handle actions.

- Lifecycle: an effect is unregistered with the injector that created it, so component-scoped or route-scoped effect classes never accumulate duplicates.

- Concurrency: every run goes on in parallel unless the effect declares otherwise. `'latest'` supersedes the run in flight, `'first'` holds a new dispatch back, and `cancelOn` abandons a run on demand. Abandoning drops the answer and unsubscribes the source; it never touches the updater.

### 5. Managers

In ngx-statewise, a manager is the bridge between your UI and your state logic. It exposes state as reactive signals and offers a declarative API to trigger actions. This keeps components simple, state interactions predictable, and everything testable.

A manager gets its dispatch handle from `injectStatewise`, passing the updaters it owns.

```typescript
import { injectStatewise } from 'ngx-statewise';

@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly statewise = injectStatewise(authUpdater);
}
```

`injectStatewise` must be called in an injection context, like `inject`. It resolves each updater's state through the injector of the caller, once and for all.

#### State Exposure

Managers expose state reactively to the components depending on it, so those components bind to signals rather than handling state logic themselves.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly statewise = injectStatewise(authUpdater);

  // State exposure: read-only signals
  public readonly user = this.authStates.user.asReadonly();
  public readonly isLoggedIn = this.authStates.isLoggedIn.asReadonly();
  public readonly isLoading = this.authStates.isLoading.asReadonly();
}
```

#### Dispatching Actions

The handle returned by `injectStatewise` exposes the whole dispatch API:

| Member                  | Returns         | Description                                                          |
| ----------------------- | --------------- | -------------------------------------------------------------------- |
| `dispatch(action)`      | `void`          | Starts the action without waiting for it.                            |
| `dispatchAsync(action)` | `Promise<void>` | Resolves once the whole cascade started by the action is over.       |
| `waitForEffect(action)` | `Promise<void>` | Waits for the effects **this manager** started for that action type. |
| `waitForAllEffects()`   | `Promise<void>` | Waits for every effect **this manager** started.                     |

`waitForEffect` takes an action creator or an action, never a raw string, so a typo in an action type is a compile error:

```typescript
await this.statewise.waitForEffect(loginActions.request);
```

Observation is scoped like dispatch: two managers awaiting the same action type never wait for each other. The action history is not on the handle at all: it is application-wide, so it is injected instead — `inject(ActionHistory).snapshot()`.

##### Synchronous Dispatch

```typescript
this.statewise.dispatch(logoutAction());
```

`dispatch` applies the updater immediately, then starts the effects without waiting for them. Use it when you don't need to know when the side effects are done.

##### Asynchronous Dispatch

```typescript
await this.statewise.dispatchAsync(loginActions.request(credentials));
```

`dispatchAsync` returns a `Promise<void>` that resolves once every effect triggered by the action, and every action those effects returned, have completed recursively. This is what you want for flows like authentication, where navigation must wait for the outcome.

##### Error handling

The two dispatches differ in how they report failures, and the difference is deliberate:

| Failure           | `dispatch`                            | `dispatchAsync`     |
| ----------------- | ------------------------------------- | ------------------- |
| An updater throws | Throws synchronously at the call site | Rejects the promise |
| An effect fails   | Reported to Angular's `ErrorHandler`  | Rejects the promise |

An updater failure is a programming error: it surfaces where it happened rather than being buried in a promise nobody awaits. An effect failure is an execution error: with `dispatch` nobody is there to receive it, so it goes to the `ErrorHandler`; with `dispatchAsync` the caller gets it.

When several effects run for the same action, ngx-statewise waits for all of them before reporting the first failure. A failing effect never leaves its siblings running unobserved.

#### Example: `AuthManager`

```typescript
@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly statewise = injectStatewise(authUpdater);

  // State exposure: read-only signals
  public readonly user = this.authStates.user.asReadonly();
  public readonly isLoggedIn = this.authStates.isLoggedIn.asReadonly();
  public readonly isLoading = this.authStates.isLoading.asReadonly();

  // Awaits the whole login cascade
  public login(credentials: LoginSubmit): Promise<void> {
    return this.statewise.dispatchAsync(loginActions.request(credentials));
  }

  // Fire and forget
  public logout(): void {
    this.statewise.dispatch(logoutAction());
  }
}
```

#### Key Notes:

- Managers are the coordination layer between your components and your logic. They expose state as signals and dispatch actions, giving a consistent, typed and testable API.

- Updaters describe how state reacts. They are attached to a manager through `injectStatewise`, or made global through `provideStatewise`. A manager only ever sees the updaters it declared, plus the global ones.

- Effects handle asynchronous or side-effecting operations. They are registered globally, from the effect classes listed in `provideStatewise`.

- Each part — Managers, Updaters, Effects — has one focused responsibility, which keeps the state flow predictable and easy to reason about as the application grows.

## Testing

The `ngx-statewise/testing` entry point wires the library into a `TestBed` and gives you the two things a test usually needs: a way to let effects settle, and a way to relax the misrouted-dispatch check.

```typescript
import { captureStatewiseDeclarations, drainEffects, provideStatewiseTesting } from 'ngx-statewise/testing';
```

| Export                             | Description                                                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provideStatewiseTesting(config?)` | Same options as `provideStatewise`, plus `strict`. `strict: false` silences the misrouted-dispatch check entirely — it reports nothing either, so a suite asserting an empty `ErrorHandler` stays green. The action history is enabled by default, so a test can assert what was dispatched without configuring anything. |
| `drainEffects()`                   | Resolves once every effect in flight in the current `TestBed` is over, whichever manager started it.                                                                                                                                                                                                                      |
| `captureStatewiseDeclarations()`   | Records the updater declarations known right now and returns the function restoring them.                                                                                                                                                                                                                                 |

### Letting a fire-and-forget dispatch settle

`dispatch` does not return a promise, so a test asserting on its side effects needs to wait for them:

```typescript
TestBed.configureTestingModule({
  providers: [provideStatewiseTesting({ effects: [TaskEffect] })],
});

manager.refresh(); // calls statewise.dispatch(...)
await drainEffects();

expect(manager.tasks()).toHaveSize(3);
```

### Dispatching without attaching an updater

A test that only exercises effects can dispatch an action whose updater it never attached. That is exactly what the misrouted-dispatch check forbids, so turn it off for that suite:

```typescript
TestBed.configureTestingModule({
  providers: [provideStatewiseTesting({ strict: false, effects: [AuthEffect] })],
});
```

### Declaring updaters inside tests

`defineUpdater` records its action types when the module is loaded, and a suite calling it inside its tests would leak those declarations into the following ones. Capture and restore around it:

```typescript
let restoreDeclarations: () => void;

beforeEach(() => (restoreDeclarations = captureStatewiseDeclarations()));
afterEach(() => restoreDeclarations());
```

Prefer `strict: false` when you simply want the check off: it is scoped to one `TestBed`, whereas the declarations are module-level.

## Migrating from 0.6.x

The execution core was rewritten. The public API is smaller and the concepts have not changed, but the names and the wiring did.

| 0.6.x                                         | Now                                                                                             |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `IUpdator` / `UpdatorRegistry` class          | `defineUpdater(StateToken, (on) => ...)`                                                        |
| `provideUpdators([...])`                      | `provideStatewise({ updaters: [...] })`                                                         |
| `provideEffects([...])`                       | `provideStatewise({ effects: [...] })`                                                          |
| `registerLocalUpdator(this, updator)`         | `injectStatewise(updater)`                                                                      |
| `dispatch(action, scope)`                     | `statewise.dispatch(action)`                                                                    |
| `dispatchAsync(action, scope)`                | `statewise.dispatchAsync(action)`                                                               |
| `waitForEffect(type)` / `waitForAllEffects()` | `statewise.waitForEffect(creator)` / `statewise.waitForAllEffects()`, now scoped to the manager |
| `defineSingleAction(...).action`              | `defineSingleAction(...)` returns the creator itself                                            |
| type `StatewiseRef`                           | type `Statewise`                                                                                |
| type `UpdaterDefinition<State>`               | type `Updater<State>`                                                                           |
| type `SWEffects`                              | type `EffectOutcome`                                                                            |
| `statewise.recordedActions()`                 | `inject(ActionHistory).snapshot()`                                                              |

Action creators (`defineActionsGroup`, `defineSingleAction`, `payload`, `emptyPayload`, `ofType`) are unchanged, and the generated action strings are identical. `createEffect` keeps its signature and now returns an `EffectRef`, which you can ignore.

Three behaviours changed beyond the renames:

- **Dispatching an action owned by another manager now throws in dev mode** instead of doing nothing, and reports to the `ErrorHandler` in production. If an effect used to return another feature's action, call that feature's manager instead. See [Dispatching through the right manager](#dispatching-through-the-right-manager).
- **An effect runs only for the manager owning its action's updater.** Registration is still application-wide; visibility is not. A misrouted dispatch runs nothing at all — neither the updater nor the effects. Actions no updater claims keep running their effects everywhere. See [Scope](#scope).
- **`waitForEffect` and `waitForAllEffects` are scoped to the manager** that owns them, and `waitForEffect` no longer accepts a raw action-type string.
- **The action history left the dispatch handle.** `recordedActions()` is gone from `Statewise`; inject `ActionHistory` and call `snapshot()`. The history was always application-wide, so a handle that scopes everything else was the wrong place to read it from — and reading it forced an `injectStatewise()` with no updater at all, purely to get at a global. `snapshot()` returns the same plain array as before.

An updater class becomes a declaration:

```typescript
// Before
@Injectable({ providedIn: 'root' })
export class AuthUpdator implements IUpdator<AuthStates> {
  public readonly state = inject(AuthStates);

  public readonly updators: UpdatorRegistry<AuthStates> = {
    [ofType(loginActions.request)]: (state) => {
      state.isLoading.set(true);
    },
  };
}

// After
export const authUpdater = defineUpdater(AuthStates, (on) => {
  on(loginActions.request, (state) => {
    state.isLoading.set(true);
  });
});
```

And a manager takes its handle instead of calling the global functions:

```typescript
// Before
export class AuthManager {
  private readonly authUpdator = inject(AuthUpdator);

  constructor() {
    registerLocalUpdator(this, this.authUpdator);
  }

  public login(credentials: LoginSubmit): Promise<void> {
    return dispatchAsync(loginActions.request(credentials), this);
  }
}

// After
export class AuthManager {
  private readonly statewise = injectStatewise(authUpdater);

  public login(credentials: LoginSubmit): Promise<void> {
    return this.statewise.dispatchAsync(loginActions.request(credentials));
  }
}
```

What this buys you: two managers can now dispatch the same action type concurrently without sharing state or observation, `dispatchAsync` really awaits the whole cascade including nested effects, an unexpected failure is no longer swallowed, a misrouted dispatch is reported instead of silently skipped, effects run only for the manager owning their action, and effects die with the injector that registered them.

## Benefits

- **Intuitive Action Flow**: Unlike traditional Redux-based libraries, ngx-statewise implements a direct, intuitive flow where actions connect directly to updaters and effects. This reduces cognitive overhead and makes the state management pattern easier to understand and implement.

- **Signals-First Approach**: Leveraging Angular's native signals for reactive state management, ngx-statewise offers superior performance with automatic UI updates when state changes. This eliminates the need for manual subscription handling that's common with Observable-based solutions.

- **Enforced Unidirectional Flow**: The library's design enforces a predictable sequence (Action → Updater → Effect → Potentially More Actions) that makes debugging and reasoning about application state much simpler. By ensuring state is updated before effects run, all side effects work with the latest state data.

- **Cascading Effects**: ngx-statewise excels at creating powerful chains of operations through its cascading effects design. One action can trigger state updates which lead to effects that dispatch additional actions, making complex workflows easier to orchestrate and maintain.

- **Clear Separation of Concerns**: The library enforces explicit boundaries between state updates (updaters) and side effects, leading to more maintainable code that's easier to test and reason about.

## When to Use ngx-statewise

- **Signal-Based Applications**: If you're building new Angular applications or migrating existing ones to leverage the power of Angular signals, ngx-statewise provides the ideal state management solution that's specifically designed to work harmoniously with signals.

- **Applications with Sequential Workflows**: For applications that require predictable chains of operations where one action leads to state changes followed by side effects that may trigger additional actions, ngx-statewise's cascading effects model provides elegant solutions.

- **Projects Requiring Predictable State Updates**: The enforced sequence where state is always updated before effects run makes ngx-statewise particularly well-suited for applications where consistency between state and side effects is critical.

- **Medium to Large Angular Applications**: The modular architecture scales well for larger applications with complex state management needs while keeping the codebase organized and maintainable.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on GitHub.

## License

GPL v3
