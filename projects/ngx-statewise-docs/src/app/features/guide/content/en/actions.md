---
slug: actions
title:
  en: Actions
  fr: Actions
  es: Actions
  de: Actions
  pt-BR: Actions
summary:
  en: Action groups, single actions, and the types they generate.
  fr: Groupes d’actions, actions seules, et les types générés.
  es: Grupos de actions, actions sueltas y los tipos que generan.
  de: Action-Gruppen, einzelne Actions und die Typen, die sie erzeugen.
  pt-BR: Grupos de actions, actions avulsas e os tipos que geram.
---

# Actions

An action states an intent: something happened, and this is what came with it.
You never write its type string by hand.

An action carries a type — a string identifying the event — and an optional
payload. Declare them in a group when they belong to one flow, or on their own
when they stand alone, and the library generates the types.

## Action groups

`defineActionsGroup` builds each type from a source and an event name. Use it
for a set of related actions: a loading flow, an error path, anything gathered
under one subject.

```typescript title="auth.actions.ts"
import { defineActionsGroup, payload, emptyPayload } from 'ngx-statewise';

export const loginActions = defineActionsGroup({
  source: 'LOGIN',
  events: {
    request: payload<LoginSubmit>(), // LOGIN_REQUEST
    success: payload<LoginResponse>(), // LOGIN_SUCCESS
    failure: emptyPayload, // LOGIN_FAILURE
    cancel: emptyPayload, // LOGIN_CANCEL
    retry: payload<number>(), // LOGIN_RETRY
  },
});
```

Each value in `events` says what the action carries. `payload<T>()` declares a
`T`; `emptyPayload` declares nothing, and its creator takes no argument.

```typescript
statewise.dispatch(loginActions.request({ email, password }));
statewise.dispatch(loginActions.failure());
```

An event name in `camelCase` becomes `SCREAMING_SNAKE_CASE`, so
`refreshToken` under the source `AUTH` is `AUTH_REFRESH_TOKEN`.

## Single actions

`defineSingleAction` is for an action that belongs to no group. It suffixes the
type with `_ACTION`, which keeps it from colliding.

```typescript title="auth.actions.ts"
import { defineSingleAction, emptyPayload, payload } from 'ngx-statewise';

export const logoutAction = defineSingleAction('LOGOUT', emptyPayload);
export const selectItemAction = defineSingleAction('SELECT_ITEM', payload<number>());
```

`LOGOUT` becomes `LOGOUT_ACTION`, and `SELECT_ITEM` becomes
`SELECT_ITEM_ACTION`.

> [!WARNING]
> The two are not symmetrical about case. `defineActionsGroup` upper-cases its
> source; `defineSingleAction` does not.

```typescript avoid title="auth.actions.ts"
export const logoutAction = defineSingleAction('logout', emptyPayload);
// The type is `logout_ACTION`.
```

```typescript prefer title="auth.actions.ts"
export const logoutAction = defineSingleAction('LOGOUT', emptyPayload);
// The type is `LOGOUT_ACTION`.
```

`defineSingleAction` returns the creator itself, so it is used exactly like one
from a group:

```typescript
statewise.dispatch(logoutAction());
statewise.dispatch(selectItemAction(42));

on(logoutAction, (state) => { ... });
createEffect(selectItemAction, (id) => { ... });
```

## Reading a type

Updaters and effects match on the generated string, so it has to agree exactly.
`ofType` gives it to you, as a literal type rather than a widened `string`:

```typescript
ofType(loginActions.request); // 'LOGIN_REQUEST'
ofType(logoutAction); // 'LOGOUT_ACTION'
ofType({ type: 'MY_ACTION' }); // 'MY_ACTION'
```

You rarely need it in application code — an updater and an effect both take the
creator, not its string. It earns its place in tests and in logging.

## Key notes

- `defineActionsGroup` for a flow, `defineSingleAction` for a standalone
  operation. Both produce creators used the same way.
- Grouping `request` / `success` / `failure` under one source keeps a flow
  readable, and keeps its types from colliding with another feature's.
- An action nothing handles is still valid. It exists to trigger effects, and
  nothing warns you about it — see
  [what the check cannot see](/guide/updaters#what-the-check-cannot-see).

Next: [Updaters](/guide/updaters).
