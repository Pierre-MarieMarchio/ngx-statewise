# ngx-statewise

A lightweight and intuitive state management library for Angular.

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Installation](#installation)
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

## Features

- 🔄 Flexible state management: Supports Angular signals for automatic reactivity and updates. You can also use regular properties if you prefer manual reactivity.
- 🧩 Modular and maintainable architecture: Easily extendable with actions, effects, and handlers.
- 📦 Predictable state updates: Updates are dispatched through actions, with clear and explicit state mutations.
- 🚀 Effects: Handles asynchronous operations and side effects in a clean and declarative way.
- 🔍 Easy to debug: State changes and effects are transparent and easy to track.

## Installation

```bash
npm install ngx-statewise
```

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

````typescript
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
````

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

#### Interface Implementation

A class implementing Updator must adhere to the `IUpdator` interface. This interface defines two main properties:

- `state`: The current state instance that the updator will modify.
- `updators`: A registry of action types (as keys) and their corresponding handler functions that update the state.

Every Updator class should implement the IUpdator interface to ensure that it follows the expected structure for state updates and action handling.

#### Using Action Type Strings

In this method, the action type key in the updator must exactly match the type of the action, such as `LOGIN_REQUEST`, `LOGIN_SUCCESS`, etc. This method still works and is useful when action types are simple.

```typescript
@Injectable({
  providedIn: "root",
})
export class AuthUpdator implements IUpdator<AuthStates> {
  public readonly state = inject(AuthStates);

  public readonly updators: UpdatorRegistry<AuthStates> = {
    LOGIN_REQUEST: (state) => {
      // Only modify state data, no side effects here
      state.isLoading.set(true);
      state.asError.set(false);
    },
    LOGIN_SUCCESS: (state, payload: LoginResponses) => {
      state.user.set({
        userId: payload.userId,
        userName: payload.userName,
        email: payload.email,
      });
      state.isLoggedIn.set(true);
      state.isLoading.set(false);
    },
    LOGIN_FAILURE: (state) => {
      state.user.set(null);
      state.isLoggedIn.set(false);
      state.asError.set(true);
      state.isLoading.set(false);
    },
    LOGOUT_ACTION: (state) => {
      state.user.set(null);
      state.isLoggedIn.set(false);
      state.asError.set(false);
      state.isLoading.set(false);
    },
  };
}
```

#### Using ofType for More Dynamic Action Matching

A more flexible approach allows you to dynamically match actions to their handlers using `ofType`. This approach is especially useful when using action groups or if the action types need to be referenced programmatically.

```typescript
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
    [ofType(loginActions.success)]: (state, payload: LoginResponses) => {
      state.user.set({
        userId: payload.userId,
        userName: payload.userName,
        email: payload.email,
      });
      state.isLoggedIn.set(true);
      state.isLoading.set(false);
    },
    [ofType(loginActions.failure)]: (state) => {
      state.user.set(null);
      state.isLoggedIn.set(false);
      state.asError.set(true);
      state.isLoading.set(false);
    },
    [ofType(logoutAction.action)]: (state) => {
      state.user.set(null);
      state.isLoggedIn.set(false);
      state.asError.set(false);
      state.isLoading.set(false);
    },
  };
}
```

In the second approach:

- Dynamic Mapping: We use `ofType(action)` to bind specific handlers to actions. This allows for more dynamic and programmatically reusable code, especially in large applications with many actions and complex state management.

- Event Handling: Actions are now dynamically matched, making it easier to handle a variety of different actions without manually managing action type strings.

#### Key Notes:

- State Updates Only: Updators should focus solely on state updates. Any side effects, such as API calls or complex business logic, should be handled in Effects.

- Direct Action Matching: Both methods (using action type strings directly and ofType) provide a simple way to match actions to state updates. The ofType approach adds more flexibility, especially when working with action groups.

- Interface Implementation: Every Updator class must implement the IUpdator interface to ensure that the state and updators are properly defined and managed.

### 4. Effects

Effects are responsible for handling asynchronous operations such as API calls, navigation, or side effects that are not directly related to state updates. They are created using the `createEffect` utility function and are tied to specific actions. Effects can return other actions to trigger Updators or even other effects, creating a chain of operations.

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

#### Key Notes:

- Promises (default): By default, effects should return Promises. This is ideal for handling single asynchronous operations.

- Observables (optional): If needed, you can also return Observables in your effects, particularly useful for handling streams or multiple values over time.

- Avoid Infinite Loops: Be careful not to return the input action from the effect (e.g., avoid returning the same action that triggered the effect). This can lead to infinite loops of action dispatching.

- Side Effects: Effects are designed for side effects like API calls, routing, or other asynchronous operations. They should not directly modify the state. That’s the role of Updators.

- Effect Registration: Don’t forget to register your effects using provideEffects to ensure that they are initialized and ready to handle actions.

### 5. Managers

Managers provide a clean and declarative API layer between your UI and your application's state logic. Their primary responsibilities include:

- Exposing state values (signals or properties) to components.

- Triggering actions that may update state or invoke side effects (e.g., API calls).

- Optionally awaiting effects when synchronization is needed (e.g., before navigation or in unit tests).

This separation of concerns leads to more maintainable, testable, and predictable state interactions.

#### Dispatching Actions

| Function                       | Behavior                                                                                     |
|---------------------------------|----------------------------------------------------------------------------------------------|
| `dispatch(action, updator)`     | Triggers a state update and optionally an effect, but does not wait for async operations to finish. |
| `dispatchAsync(action, updator)`| Dispatches the action and returns a promise that resolves when the associated effect completes. |
| `waitForEffect(actionType)`     | Waits for the effect tied to a specific action type to finish.                               |
| `waitForAllEffects()`           | Waits for all in-progress effects regardless of type — useful for synchronization points.    |

#### Example: `AuthManager`

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly authUpdator = inject(AuthUpdator);

  // Public state exposure
  public readonly user = this.authStates.user;
  public readonly isLoggedIn = this.authStates.isLoggedIn;
  public readonly isLoading = this.authStates.isLoading;
  public readonly asError = this.authStates.asError;

  /**
   * Trigger login without waiting for the async effect.
   * This is useful for cases where you don't care about the outcome immediately.
   */
  public login(credentials: LoginSubmit): void {
    dispatch(loginActions.request(credentials), this.authUpdator);
  }

  /**
   * Trigger login and wait for the effect to complete (e.g., API call).
   * Use this when you need to synchronize UI flow or logic after login completes.
   */
  public async loginAsync(credentials: LoginSubmit): Promise<void> {
    await dispatchAsync(loginActions.request(credentials), this.authUpdator);
  }

  /**
   * Trigger logout synchronously.
   */
  public logout(): void {
    dispatch(logoutAction.action(), this.authUpdator);
  }

  /**
   * Wait only for the login request effect to finish.
   * Useful when you dispatch the action elsewhere but want to await its completion.
   */
  public async waitForLoginEffect(): Promise<void> {
    await waitForEffect(loginActions.request().type);
  }

  /**
   * Wait for **all active effects** (any action type).
   * This is especially useful in:
   * 
   * - SSR (Server-Side Rendering) where all state must be resolved before rendering.
   * - E2E testing to await all background operations.
   * - Complex flows with multiple parallel async actions.
   */
  public async waitForAllPendingEffects(): Promise<void> {
    await waitForAllEffects();
  }
}
```
#### When to Wait?

- Use `dispatchAsync` in flows where the next operation depends on the success/failure of an effect (e.g., login, form submission).

- Use `waitForEffect` if the action was dispatched elsewhere but you still want to wait for it.

- Use `waitForAllEffects` in advanced scenarios where you need to ensure all background effects are completed:

  - Route guards (wait for state to be fully populated before allowing navigation).

  - SSR/hydration logic.

  - Complex forms with multiple parallel API calls.

  - Tests that require deterministic state before assertions.


## Benefits

- **Simplicity**: ngx-statewise offers a clean and intuitive API that reduces boilerplate, making it easier to integrate and use compared to more complex state management solutions like NgRx or NGXS. The system is designed with ease of use in mind, allowing developers to quickly get up to speed without sacrificing functionality.
- **Performance**: ngx-statewise leverages Angular's native signals for state updates, which provides highly optimized change detection and minimal rendering overhead. This ensures that updates to the UI are handled efficiently, even in larger applications. For projects that do not require signals, the system can still operate effectively with regular properties, making it adaptable to various performance needs.
- **Modularity**: The library enforces a clear separation of concerns between states, actions, and effects. This modular architecture ensures that code is maintainable, scalable, and easily extensible. Actions, effects, and state management logic are isolated into different classes, making it easy to modify or extend without impacting other parts of the application.
- **Testability**: ngx-statewise is built with testability in mind. With actions, effects, and state updates all separated, unit testing becomes more straightforward. Since the architecture promotes clear dependencies, testing each piece of logic (such as actions or effects) in isolation is a breeze, making it easy to ensure the reliability of your codebase.
- **Flexibility**:  Whether you're working with Angular signals or regular properties, ngx-statewise is flexible enough to accommodate both. This allows teams to gradually adopt signals into their workflow without completely rewriting their state management setup. This gradual adoption is ideal for teams transitioning from legacy state management patterns.

## When to Use ngx-statewise

- Medium to large Angular applications: ngx-statewise is ideal for applications with medium to large-sized codebases where state management needs to be well-organized and maintainable. It is especially effective in applications with multiple features and a complex state that requires clear separation between UI, state logic, and side effects.
- Applications with complex state management needs:  If your application deals with a variety of state changes such as managing user sessions, interacting with APIs, or performing complex asynchronous operations. ngx-statewise provides a structured, predictable framework to handle these interactions. The modular approach makes it easy to scale state management logic as your app grows.
- Teams looking for a balance between structure and simplicity: gx-statewise is perfect for teams that want the benefits of a well-structured state management system (like NgRx) but need something simpler and easier to implement. It strikes a balance between ensuring a predictable flow of data while avoiding the boilerplate often associated with more complex state management systems.
- Projects that want to leverage Angular signals but need more structure: or projects already using or planning to use Angular signals for optimized change detection, ngx-statewise is the perfect fit. It allows you to easily integrate signals into your state management while providing additional structure for managing actions, effects, and state updates. It’s especially useful for teams wanting to leverage signals without completely abandoning a structured state management solution.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on GitHub.

## License

GPL v3
