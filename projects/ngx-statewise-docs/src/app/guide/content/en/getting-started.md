# Getting started

## Installation

```bash
npm install ngx-statewise
```

## Setting up your application

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

> [!IMPORTANT]
> `history.limit` must be a positive integer. `provideStatewise` checks it
> where you call it, before anything is injected, so `{ limit: 0 }` or a
> fractional value fails at startup rather than silently recording nothing.

Omitting `history` altogether is what disables the history — that is the
default, and it is not an error.
