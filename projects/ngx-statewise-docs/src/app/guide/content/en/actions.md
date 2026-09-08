# Actions

An action states an intent: something happened, and this is what came with it.
It carries a type, a string identifying the event, and an optional payload.

You never write that string by hand. Declare actions in a group when they belong
to one flow, or on their own when they stand alone, and ngx-statewise generates
the types for you.

## Action groups

`defineActionsGroup` builds each action type from the source, a base name, and the name of the event. Use it for a set of related actions, such as a loading flow or error handling, gathered under a common source.

With a source of `'LOGIN'`, the event `request` becomes `LOGIN_REQUEST`, `success` becomes `LOGIN_SUCCESS`, and so on.

The following example declares a group of related actions:

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

In that group:

- `LOGIN_REQUEST` carries a `LoginSubmit` payload, and you dispatch it when a login request is made.
- `LOGIN_SUCCESS` carries a `LoginResponse` payload, and you dispatch it when the login succeeds.
- `LOGIN_FAILURE` and `LOGIN_CANCEL` need no payload, so they use `emptyPayload`.

## Single actions

Use `defineSingleAction` for an action that belongs to no group. It suffixes the type with `_ACTION`, which keeps it unique.

`'LOGOUT'` becomes `'LOGOUT_ACTION'`, and `'SELECT_ITEM'` becomes `'SELECT_ITEM_ACTION'`. Declare them like this:

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

In that example:

- `LOGOUT_ACTION` carries no payload, as `emptyPayload` declares. Dispatch it when the user logs out.
- `SELECT_ITEM_ACTION` carries a number, the id of the selected item.

`defineSingleAction` returns the creator itself, so you use it exactly like a creator coming from an action group:

```typescript
statewise.dispatch(logoutAction());
statewise.dispatch(selectItemAction(42));

on(logoutAction, (state) => { ... });
createEffect(selectItemAction, (id) => { ... });
```

## Action types

Every action has its own type, whether it belongs to a group or stands alone. ngx-statewise generates that type from the name of the action and from the way it was declared:

- `loginActions.request` has the type `LOGIN_REQUEST`.
- `logoutAction` has the type `LOGOUT_ACTION`.

## Key notes

- `defineActionsGroup` for a flow, `defineSingleAction` for a standalone
  operation. Both produce creators used the same way.
- Updaters and effects match on the generated string, so it has to agree
  exactly. `ofType(creator)` returns it, typed.
- Grouping `request / success / failure` under one source keeps a flow readable,
  and keeps its types from colliding with another feature's.
