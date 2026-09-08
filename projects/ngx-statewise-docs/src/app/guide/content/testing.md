# Testing

The `ngx-statewise/testing` entry point wires the library into a `TestBed` and gives you the two things a test usually needs: a way to let effects settle, and a way to relax the misrouted-dispatch check.

```typescript
import { captureStatewiseDeclarations, drainEffects, provideStatewiseTesting } from 'ngx-statewise/testing';
```

| Export                             | Description                                                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provideStatewiseTesting(config?)` | Same options as `provideStatewise`, plus `strict`. `strict: false` silences the misrouted-dispatch check entirely — it reports nothing either, so a suite asserting an empty `ErrorHandler` stays green. The action history is enabled by default, so a test can assert what was dispatched without configuring anything. |
| `drainEffects()`                   | Resolves once every effect in flight in the current `TestBed` is over, whichever manager started it.                                                                                                                                                                                                                      |
| `captureStatewiseDeclarations()`   | Records the updater declarations known right now and returns the function restoring them.                                                                                                                                                                                                                                 |

## Letting a fire-and-forget dispatch settle

`dispatch` does not return a promise, so a test asserting on its side effects needs to wait for them:

```typescript
TestBed.configureTestingModule({
  providers: [provideStatewiseTesting({ effects: [TaskEffect] })],
});

manager.refresh(); // calls statewise.dispatch(...)
await drainEffects();

expect(manager.tasks()).toHaveSize(3);
```

## Dispatching without attaching an updater

A test that only exercises effects can dispatch an action whose updater it never attached. That is exactly what the misrouted-dispatch check forbids, so turn it off for that suite:

```typescript
TestBed.configureTestingModule({
  providers: [provideStatewiseTesting({ strict: false, effects: [AuthEffect] })],
});
```

## Declaring updaters inside tests

`defineUpdater` records its action types when the module is loaded, and a suite calling it inside its tests would leak those declarations into the following ones. Capture and restore around it:

```typescript
let restoreDeclarations: () => void;

beforeEach(() => (restoreDeclarations = captureStatewiseDeclarations()));
afterEach(() => restoreDeclarations());
```

Prefer `strict: false` when you simply want the check off: it is scoped to one `TestBed`, whereas the declarations are module-level.
