# Getting started

## Installation

```bash
npm install ngx-statewise
```

## Setting up your application

Add `provideStatewise()` to your application's providers. It is the entry point of the library: it wires the execution engine and registers your effects and your global updaters.

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

`provideStatewise` accepts five optional options:

| Option              | Type                              | Description                                                                                                          |
| ------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `effects`           | `readonly Type<unknown>[]`        | Effect classes, instantiated eagerly so their effects are registered at startup.                                     |
| `updaters`          | `readonly Updater<unknown>[]`     | Updaters available application-wide, whichever manager dispatches.                                                   |
| `history`           | `{ limit, redact? }`              | Records the last `limit` actions. Disabled by default; `limit` must be a positive integer. `redact` rewrites an action before it is recorded. |
| `misroutedDispatch` | `'throw' \| 'report' \| 'ignore'` | What a dispatch reaching the wrong manager does. Throws in development, reports to the `ErrorHandler` in production. |
| `maxCascadeDepth`   | `number`                          | How many actions one cascade may chain, the dispatched action included. Defaults to 50; must be a positive integer.  |

> [!IMPORTANT]
> `history.limit` must be a positive integer. `provideStatewise` checks it
> where you call it, before anything is injected, so `{ limit: 0 }` or a
> fractional value fails at startup rather than silently recording nothing.

Leave `history` out to disable the history. That is the default, and it is not
an error.
