# ngx-statewise

A lightweight and intuitive state management library for Angular.

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Getting Started](#getting-started)
- [Key Concepts](#key-concepts)
  - [1. States](#1-states)
  - [2. Actions](#2-actions)
  - [3. Updators](#3-updators)
  - [4. Effects](#4-effects)
  - [5. Managers](#5-managers)
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

- **Manager Dispatches Action**: The manager dispatches this action, which triggers the appropriate updator.

- **Updator Updates State**: The updator modifies the state based on the action and its payload.

- **Effect Handles Side Effects**: After the state is updated, any related effect is triggered to handle side operations (like API calls).

- **Chain of Actions**: Effects can dispatch additional actions, which in turn can trigger other updators and effects, creating a chain of operations if needed.

### Paradigm Shift

While NgRx and NGXS implement state management based on redux-style patterns with stores, reducers, and selectors, ngx-statewise introduces a paradigm shift:

- **Direct Action Flow**: Instead of actions going through a centralized store, actions are directly linked to their updators and effects, making the flow more intuitive.

- **Signals over Observables**: Rather than relying heavily on RxJS observables for everything, ngx-statewise leverages Angular's native signals for state reactivity.

- **Explicit Separation**: The library enforces a clear distinction between state updates (updators) and side effects, making the codebase easier to maintain.

- **Simplified Boilerplate**: The amount of code required to implement state management is significantly reduced compared to NgRx or NGXS.

The unidirectional flow (Action → Updator → Effect → Potentially More Actions) in ngx-statewise makes state management highly predictable and easier to debug. The library implements a deliberate design choice where an action must be dispatched first, triggering a state update via updators before any effects are executed. This represents a fundamental difference from Redux-based libraries like NgRx, where effects often run concurrently with or even before state updates. In ngx-statewise, by ensuring state is updated first, all effects work with the latest state data, creating more predictable behavior. However, this enforced sequence may require an adjustment in thinking for developers accustomed to other state management approaches where effects can be triggered independently or in different orders.

### Considerations

- **Complex Queries**: For extremely complex state derivation and selection patterns, the built-in capabilities might need to be extended.

- **Action-First Approach**: Unlike some libraries where effects can be triggered independently, ngx-statewise requires an action to be dispatched first, which then updates state before triggering effects. This enforces a specific flow that might require adjustment in thinking if coming from other patterns.

It's important to note that while ngx-statewise supports dispatching individual actions, its primary design intention is to leverage cascading effects - where one action triggers an updator, which leads to an effect, which may then dispatch additional actions, creating powerful chains of operations. This design philosophy particularly shines in complex applications with interconnected state changes and sequential operations.

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

To use ngx-statewise, you need to add the `provideStatewise()` function to your application's providers:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideStatewise(),
    // other providers
  ],
};
```

This setup ensures that ngx-statewise is properly initialized and can manage state throughout your application.

## Key Concepts

### 1. States

States represent the current state of your application or a specific feature. They can be defined using Angular signals for reactivity, or as regular properties for manual reactivity.

#### Using Angular signals:

Signals are the recommended approach as they automatically trigger component updates when state changes. Here's an example of how you can define state using signals:

```typescript
@Injectable({
  providedIn: "root",
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
    request: payload<LoginSubmit>(),  // Becomes LOGIN_REQUEST
    success: payload<LoginResponse>(),  // Becomes LOGIN_SUCCESS
    failure: emptyPayload,  // Becomes LOGIN_FAILURE
    cancel: emptyPayload,  // Becomes LOGIN_CANCEL
    retry: payload<number>(),  // Becomes LOGIN_RETRY
  },
});
```

In the above example:

- The `LOGIN_REQUEST` action will be triggered when a login request is made, with a payload of type `LoginSubmit`.
- The `LOGIN_SUCCESS` action will be triggered when the login operation succeeds, with a payload of type `LoginResponse`.
- The `LOGIN_FAILURE`, `LOGIN_CANCEL`, actions don't require payloads, so they are defined with emptyPayload.

#### Single Action

For single actions that do not require grouping, you can use defineSingleAction. These actions will automatically be suffixed with `_ACTION` to ensure their uniqueness.

For example, `'LOGOUT'` becomes `'LOGOUT_ACTION'`, and `'SELECT_ITEM'` becomes `'SELECT_ITEM_ACTION'`. Here's how you define them:

```typescript
import { defineSingleAction, emptyPayload, payload } from "ngx-statewise";

export const logoutAction = defineSingleAction("LOGOUT", emptyPayload); // Becomes LOGOUT_ACTION
export const selectItemAction = defineSingleAction("SELECT_ITEM", payload<number>()); // Becomes SELECT_ITEM_ACTION
```

In this case:

- The `LOGOUT_ACTION` will be dispatched when the user logs out, with no payload, as indicated by `emptyPayload`.
- The `SELECT_ITEM_ACTION` will be triggered when an item is selected, and the payload will be a number (likely the item ID).

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

- Action types are used as keys in updators and effects, and they must match exactly.

- The `ofType(action)` helper ensures correct and type-safe usage when wiring actions into updators or effects.

- Grouping related actions improves clarity and structure, especially for common flows like `request / success / failure`.

### 3. Updators

Updators are responsible for updating the state in response to actions. The action type key used in the updator must exactly match the type generated by the action definition. Updators focus solely on modifying state data—any side effects or operations not directly related to state updates should be placed in Effects.

In ngx-statewise, you can define Updators in two main ways: using action type strings directly or using ofType to tie the actions more dynamically to the respective handlers.


#### Defining Updators

##### Interface Implementation

A class implementing Updator must adhere to the `IUpdator` interface. This interface defines two main properties:

- `state`: The current state instance that the updator will modify.
- `updators`: A registry of action types (as keys) and their corresponding handler functions that update the state.

Every Updator class should implement the IUpdator interface to ensure that it follows the expected structure for state updates and action handling.


##### Using Action Type Strings

In this method, the action type key in the updator must exactly match the type of the action, such as `LOGIN_REQUEST`, `LOGIN_SUCCESS`, etc. This method still works and is useful when action types are simple.

```typescript
import { IUpdator, UpdatorRegistry } from 'ngx-statewise';

@Injectable({
  providedIn: "root",
})
export class AuthUpdator implements IUpdator<AuthStates> {
  public readonly state = inject(AuthStates);

  public readonly updators: UpdatorRegistry<AuthStates> = {
    LOGIN_REQUEST: (state) => {
      state.isLoading.set(true);
      state.asError.set(false);
    },
    LOGIN_SUCCESS: (state, payload: LoginResponses) => {...},
    
  };
}
```

##### Using ofType for More Dynamic Action Matching

A more flexible approach allows you to dynamically match actions to their handlers using `ofType`. This approach is especially useful when using action groups or if the action types need to be referenced programmatically.

```typescript
import { IUpdator, ofType, UpdatorRegistry } from 'ngx-statewise';

@Injectable({
  providedIn: "root",
})
export class AuthUpdator implements IUpdator<AuthStates> {
  public readonly state = inject(AuthStates);

  public readonly updators: UpdatorRegistry<AuthStates> = {
    [ofType(loginActions.request)]: (state) => {
      state.isLoading.set(true);
      state.asError.set(false);
    },
    [ofType(loginActions.success)]: (state, payload: LoginResponses) => {...},
  };
}
```

**In the second approach:** dynamic action handling is streamlined using `ofType(action)`, which binds specific handlers to defined actions. This promotes modular and reusable code, especially valuable in large-scale applications with numerous actions and complex state flows. By dynamically matching events, it eliminates the need to manually manage action type strings, reducing potential errors and improving overall code maintainability.

#### Registering Updators

##### Globally

To make an Updator available throughout the entire app (regardless of the calling Manager), you can register it globally via the `provideUpdators()` helper in the root configuration.

Usage in `app.config.ts`:


```typescript
import { provideUpdators  } from 'ngx-statewise';

export const appConfig: ApplicationConfig = {
  providers: [
    provideUpdators([
      AuthUpdator,
      // Add more global Updators here if needed
    ]),
    // other providers
  ],
};
```

##### Locally

A Manager can explicitly register its own Updators in its class definition. This restricts their usage to that Manager only, offering strict encapsulation.

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthManager implements IAuthManager {
  private readonly authUpdator = inject(AuthUpdator);

  constructor() {
    registerLocalUpdator(this, this.authUpdator);
  }
}
```

##### Ad-hoc

For one-off usage or testing scenarios, you can pass an Updator directly to a dispatch call. It will not be registered globally or locally, it is used only for that single dispatch. this does not persist the Updator beyond dispatch.

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthManager implements IAuthManager {
  private readonly authUpdator = inject(AuthUpdator);

  public authenticate(): Promise<void> {
    return dispatchAsync(authenticateActions.request(), this.authUpdator);
  }
}
```

#### Key Notes:

- State Updates Only: Updators should focus solely on state updates. Any side effects, such as API calls or complex business logic, should be handled in Effects.

- Direct Action Matching: Both methods (using action type strings directly and ofType) provide a simple way to match actions to state updates. The ofType approach adds more flexibility, especially when working with action groups.

- Interface Implementation: Every Updator class must implement the IUpdator interface to ensure that the state and updators are properly defined and managed.

- Important: Updators must be defined as class properties exactly as shown in the examples above. If you don't follow this pattern, the updator will not be properly registered in the system and your state updates will not work.

### 4. Effects

Effects are responsible for handling asynchronous operations such as API calls, navigation, or side effects that are not directly related to state updates. They are created using the `createEffect` utility function and are tied to specific actions. 

A key architectural principle in ngx-statewise, *for now*, is that effects always run after state has been updated by an updator. This guarantees that effects operate on the most up-to-date application state. The sequence **Action → Updator → Effect** is enforced by design to ensure predictability and consistency across your application.

Effects can return other actions to trigger Updators or even other effects, creating a chain of operations. This design promotes cascading effects, where an initial action triggers a state update, which then leads to one or more effects, each of which can dispatch further actions. Rather than encouraging isolated, standalone actions, ngx-statewise iencourage for sequences of operations, making complex workflows easier to orchestrate.

When creating effects, you must ensure that you don't return the input action directly as it can result in infinite loops. Instead, you should return new actions to trigger the corresponding state updates or other side effects.

By default, effects return Promises. However, you can also use Observables if needed, giving you flexibility based on your use case. Promises are often simpler for scenarios involving a single asynchronous operation, while Observables can be more appropriate when you need to handle multiple asynchronous values over time (e.g., streams of data).

#### Defining Effects with `createEffect`

The `createEffect` utility allows you to create an effect linked to a particular action. By default, it expects a Promise, but you can also return Observables within the effect.

Here's an example of an effect that uses a Promise:

```typescript
@Injectable({
  providedIn: "root",
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
    }
  );

  /**
   * This effect listens to the LOGOUT action and performs a simple navigation without returning any new actions.
   * It is an example of an effect returning an empty observable.
   */
  public readonly logoutEffect = createEffect(logoutAction.action, () => {
    this.router.navigate(["/"]);
    return EMPTY; // No additional action needed after logout
  });
}
```

#### Effects with Observables

While Promises are the default return type for effects, you can also return Observables if needed. This is useful for handling scenarios where you expect multiple values over time (e.g., streams of data).

Here’s an example of an effect using an Observable:

```typescript
@Injectable({
  providedIn: "root",
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
        catchError(() => of(userActions.getUserFailure())) // Failure action on error
      );
    }
  );
}
```

In the example above, the effect listens for the GET_USER_REQUEST action and uses an Observable to handle the asynchronous operation of fetching user data.

#### Registering Effects

##### Globally

As with any service in Angular, effects must be properly registered for them to be initialized when the app starts. You can use the `provideEffects` function to register your effects in your app config. Without this registration, the effects won't be initialized and nothing will happen when actions are dispatched.

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideEffects([
      AuthEffects,
      UserEffects,
      // Add all your effect classes here
    ]),
    // other providers
  ],
};
```

By registering your effects with provideEffects, Angular ensures they are instantiated and ready to listen for dispatched actions when the application starts.

##### Locally

comming

#### Key Notes:

- Promises (default): By default, effects should return Promises. This is ideal for handling single asynchronous operations.

- Observables (optional): If needed, you can also return Observables in your effects, particularly useful for handling streams or multiple values over time.

- Avoid Infinite Loops: Be careful not to return the input action from the effect (e.g., avoid returning the same action that triggered the effect). This can lead to infinite loops of action dispatching.

- Side Effects: Effects are designed for side effects like API calls, routing, or other asynchronous operations. They should not directly modify the state. That’s the role of Updators.

- Effect Registration: Don’t forget to register your effects using provideEffects to ensure that they are initialized and ready to handle actions.

### 5. Managers

In ngx-statewise, a manager serves as the bridge between your UI and the underlying state logic. It exposes application state as reactive signals and provides a declarative API for triggering actions. This design encourages clear separation of concerns, improves testability, and keeps your state interactions predictable and maintainable.

A manager typically includes state accessors (like user, isLoggedIn, etc.) and action handlers. You trigger actions using either `dispatch` or `dispatchAsync`. Use dispatch for synchronous state updates when you don’t need to wait for side effects. Use dispatchAsync when you need to wait for effects to complete—this is especially useful for flows like authentication, where you may need to wait before navigating or updating the UI.

#### State Exposure

Managers are responsible not only for dispatching actions, but also for exposing state in a reactive, declarative way to the components that depend on it. This makes components simpler, as they subscribe directly to signals rather than handling state logic themselves.

Each state slice managed by an `Updator` should be exposed as a `readonly` property in the Manager, using Angular signals (or derived computed signals when needed).

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthManager {
  private readonly authStates = inject(AuthStates);

  // State exposure : Read-only computed signals
  public readonly user = computed(() => this.authStates.user());
  public readonly isLoggedIn = computed(() => this.authStates.isLoggedIn());
  public readonly isLoading = computed(() => this.authStates.isLoading());
  public readonly asError = computed(() => this.authStates.asError());

}
```

By exposing these signals, components using this manager can simply bind to the values without needing to know about actions, effects, or state structure.

#### Dispatching Actions

You can dispatch actions in different ways depending on your use case and how the associated updator is scoped.

##### Synchronous Dispatch
```typescript
dispatch(action);
dispatch(action, scope);
```

For synchronous scenarios, use `dispatch(...)`, which triggers a state update without waiting for any asynchronous operations or effects to complete. This is ideal when you want to trigger state changes immediately and don't need to wait for any side effects (like API calls) to finish. The state update is done synchronously, and the flow continues without blocking.

##### Asynchronous Dispatch
```typescript
await dispatchAsync(action);
await dispatchAsync(action, scope);

```

or asynchronous scenarios, use `dispatchAsync(...)`, which returns a `Promise<void>` that resolves after all effects and cascading effects are complete. This is useful when you need to wait for asynchronous operations (such as API calls or other side effects) to finish before proceeding with further logic, such as navigating or updating UI components. The Promise ensures that the state updates and effects are completed before the code continues execution.

#### Dispatch Updator scope

When dispatching an action, it is important to resolve the appropriate `Updator` to update the state correctly. You can define the scope of the IUpdator in several ways, depending on whether you want to use globally, locally, or explicitly defined updators.

| Pattern | Scope | Description |
| --------- | -------- | -------------- |
| `dispatch(action)`          | Global | Uses a globally registered `Updator`, available app-wide.                                                                                          |
| `dispatch(action, this)`      | Local  | Uses a local `Updator` registered explicitly within the Manager via `registerLocalUpdator(...)`. It is scoped to the Manager.                      |
| `dispatch(action, myUpdator)` | Explicit | Uses a specific `Updator` instance passed directly to the dispatch, without persisting it globally or locally. Ideal for one-off cases or testing. |


#### Example: `AuthManager`

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly authUpdator = inject(AuthUpdator);

  constructor() {
    registerLocalUpdator(this, this.authUpdator);
  }

  // State exposure : Read-only computed signals
  public readonly user = computed(() => this.authStates.user());
  public readonly isLoggedIn = computed(() => this.authStates.isLoggedIn());
  public readonly isLoading = computed(() => this.authStates.isLoading());
  public readonly asError = computed(() => this.authStates.asError());

  // Using local updator
  public async login(credentials: LoginSubmit): Promise<void> {
    await dispatchAsync(loginActions.request(credentials), this);
  }

  // Using a directly injected updator
  public authenticate(): Promise<void> {
    return dispatchAsync(authenticateActions.request(), this.authUpdator);
  }

  // Using local updator again (sync version)
  public authenticateT(): void {
    dispatch(authenticateActions.request(), this);
  }

  // Using global updators (if provided globally)
  public logout(): void {
    dispatch(logoutAction.action());
  }
}
```

#### Key Notes:

- Managers serve as the central coordination layer between your components and the application logic. They expose state using signals or derived properties, and dispatch actions to trigger state changes or side effects. This abstraction provides a consistent, typed, and testable API for interacting with your application’s reactive state.

- Updators define how the state is updated in response to actions. They can be registered globally, making them available app-wide, or locally, scoped to a specific manager for better encapsulation. In advanced scenarios, they can also be passed inline to a single dispatch call, offering maximum flexibility without polluting global scope.

- Effects are responsible for performing asynchronous or side-effect-driven operations like API calls, routing, or logging. For now, all effects are registered globally, but support for locally scoped or inline effects (similar to updators) is planned in future versions to offer more control and composability.

- The overall architecture of ngx-statewise is designed to promote composability, maintainability, and clear separation of concerns. Each part—Managers, Updators, and Effects—has a focused responsibility, making your application’s state flow more predictable, scalable, and easier to reason about over time.

## Benefits

- **Intuitive Action Flow**: Unlike traditional Redux-based libraries, ngx-statewise implements a direct, intuitive flow where actions connect directly to updators and effects. This reduces cognitive overhead and makes the state management pattern easier to understand and implement.

- **Signals-First Approach**: Leveraging Angular's native signals for reactive state management, ngx-statewise offers superior performance with automatic UI updates when state changes. This eliminates the need for manual subscription handling that's common with Observable-based solutions.

- **Enforced Unidirectional Flow**: The library's design enforces a predictable sequence (Action → Updator → Effect → Potentially More Actions) that makes debugging and reasoning about application state much simpler. By ensuring state is updated before effects run, all side effects work with the latest state data.

- **Cascading Effects**: ngx-statewise excels at creating powerful chains of operations through its cascading effects design. One action can trigger state updates which lead to effects that dispatch additional actions, making complex workflows easier to orchestrate and maintain.

- **Clear Separation of Concerns**: The library enforces explicit boundaries between state updates (updators) and side effects, leading to more maintainable code that's easier to test and reason about.

## When to Use ngx-statewise

- **Signal-Based Applications**: If you're building new Angular applications or migrating existing ones to leverage the power of Angular signals, ngx-statewise provides the ideal state management solution that's specifically designed to work harmoniously with signals.

- **Applications with Sequential Workflows**: For applications that require predictable chains of operations where one action leads to state changes followed by side effects that may trigger additional actions, ngx-statewise's cascading effects model provides elegant solutions.

- **Projects Requiring Predictable State Updates**: The enforced sequence where state is always updated before effects run makes ngx-statewise particularly well-suited for applications where consistency between state and side effects is critical.

- **Medium to Large Angular Applications**: The modular architecture scales well for larger applications with complex state management needs while keeping the codebase organized and maintainable.


## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on GitHub.

## License

GPL v3
