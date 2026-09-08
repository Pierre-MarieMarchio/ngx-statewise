# Actions

Actions are events that trigger state changes. In ngx-statewise, actions can be defined individually or grouped together for specific event flows. Each action typically includes a type (an event identifier) and optionally a payload.

In ngx-statewise, actions are defined in a flexible and organized way, using both single actions and action groups. Action groups provide a powerful mechanism for managing related actions, while single actions are useful for standalone operations. Both are automatically typed and can include payloads when necessary. By organizing actions this way, we ensure that the state management process remains clear and predictable.

## Action Group

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

## Single Action

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

## Action Types

Each action (whether part of an action group or a single action) will have its own distinct type. These types are automatically generated based on the action's name and whether it's part of a group or standalone. This allows for clear and consistent action names throughout the application.

For example:

- The `loginActions.request` action will have the type `LOGIN_REQUEST`.
- The `logoutAction` will have the type `LOGOUT_ACTION`.

## Key Notes

- Actions can be defined individually using `defineSingleAction` or as a group using `defineActionsGroup`, depending on the use case.

- Action types are automatically generated in a consistent and predictable way:

  - For grouped actions, a source like `LOGIN` combined with an event like request produces `LOGIN_REQUEST`.

  - For single actions, a name like `LOGOUT` becomes `LOGOUT_ACTION`.

- Action types are used as keys in updaters and effects, and they must match exactly.

- The `ofType(action)` helper ensures correct and type-safe usage when wiring actions into updaters or effects.

- Grouping related actions improves clarity and structure, especially for common flows like `request / success / failure`.
