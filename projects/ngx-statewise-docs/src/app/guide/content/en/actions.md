# Actions

An action is a statement of intent: something happened, and here is what came
with it. It carries a type — a string identifying the event — and optionally a
payload.

You never write that string by hand. Declare actions in a group when they
belong to one flow, or on their own when they stand alone, and the types are
generated for you, consistently and typed.

## Action groups

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

## Single actions

For single actions that do not require grouping, you can use defineSingleAction. These actions will automatically be suffixed with `_ACTION` to ensure their uniqueness.

For example, `'LOGOUT'` becomes `'LOGOUT_ACTION'`, and `'SELECT_ITEM'` becomes `'SELECT_ITEM_ACTION'`. Here's how you define them:

```typescript
import { defineSingleAction, emptyPayload, payload } from 'ngx-statewise';

export const logoutAction = defineSingleAction('LOGOUT', emptyPayload); // Becomes LOGOUT_ACTION
export const selectItemAction = defineSingleAction('SELECT_ITEM', payload<number>()); // Becomes SELECT_ITEM_ACTION
```

> [!WARNING]
> `defineActionsGroup` upper-cases its source; `defineSingleAction` does not.
> `defineActionsGroup({ source: 'login', … })` gives you `LOGIN_REQUEST`, but
> `defineSingleAction('logout', emptyPayload)` gives you `logout_ACTION`, not
> `LOGOUT_ACTION`. Pass the source already upper-cased to a single action, as
> the examples above do, or the two conventions will not match.

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

## Action types

Each action (whether part of an action group or a single action) will have its own distinct type. These types are automatically generated based on the action's name and whether it's part of a group or standalone. This allows for clear and consistent action names throughout the application.

For example:

- The `loginActions.request` action will have the type `LOGIN_REQUEST`.
- The `logoutAction` will have the type `LOGOUT_ACTION`.

## Key notes

- `defineActionsGroup` for a flow, `defineSingleAction` for a standalone
  operation. Both produce creators used the same way.
- The generated string is the key updaters and effects match on, so it has to
  agree exactly. `ofType(creator)` returns it, typed, instead of you writing it
  out.
- Grouping `request / success / failure` under one source keeps a flow readable
  at a glance, and keeps its types from colliding with another feature's.
