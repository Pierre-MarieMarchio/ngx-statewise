---
slug: persisting-state
title:
  en: Persisting state
  fr: Persister l’état
summary:
  en: Storage in an effect, restoring through an action.
  fr: Le stockage dans un effect, la restauration par une action.
---

# Persisting state

Writing part of the state to storage and reading it back at startup, without
the updater ever learning that storage exists.

Storage is a side effect, so it belongs in an effect. Restoring is a dispatch
like any other. That is the whole design, and it keeps the updater a pure
function of the action.

## Writing

The effect runs after the updater, so it can read the value that was just
written instead of digging it out of the payload:

```typescript title="settings.storage.ts"
@Injectable({ providedIn: 'root' })
export class SettingsStorage {
  public read(): Settings | null {
    try {
      const raw = localStorage.getItem('settings');
      return raw === null ? null : (JSON.parse(raw) as Settings);
    } catch {
      // Private mode, blocked storage, corrupted value: no stored settings.
      return null;
    }
  }

  public write(settings: Settings): void {
    try {
      localStorage.setItem('settings', JSON.stringify(settings));
    } catch {
      // Nothing to do about it, and nothing worth breaking the app over.
    }
  }
}
```

```typescript title="settings.effect.ts"
@Injectable({ providedIn: 'root' })
export class SettingsEffect {
  private readonly states = inject(SettingsStates);
  private readonly storage = inject(SettingsStorage);

  public readonly persistEffect = createEffect(settingsActions.change, () => {
    // The updater has already applied the change.
    this.storage.write(this.states.snapshot());
  });
}
```

The updater knows nothing about any of this:

```typescript title="settings.updater.ts"
export const settingsUpdater = defineUpdater(SettingsStates, (on) => {
  on(settingsActions.change, (state, change) => {
    state.density.set(change.density);
    state.language.set(change.language);
  });
});
```

## Reading back

Restoring is a dispatch. Give it its own action so the updater treats it as a
change coming from outside, and so it can differ from a user change if it ever
needs to:

```typescript title="settings.updater.ts"
on(settingsActions.restored, (state, settings) => {
  state.density.set(settings.density);
  state.language.set(settings.language);
});
```

Then dispatch it once, at startup:

```typescript title="settings.manager.ts"
@Injectable({ providedIn: 'root' })
export class SettingsManager {
  private readonly storage = inject(SettingsStorage);
  private readonly statewise = injectStatewise(settingsUpdater);

  /** Called once, from an app initializer. */
  public start(): void {
    const stored = this.storage.read();

    if (stored !== null) {
      this.statewise.dispatch(settingsActions.restored(stored));
    }
  }
}
```

```typescript title="app.config.ts"
provideAppInitializer(() => {
  inject(SettingsManager).start();
});
```

> [!IMPORTANT]
> Restoring through an action rather than by writing the signals directly is
> what keeps the guarantee. If startup wrote the state behind the updater's
> back, "one place writes this value" would stop being true on the one path
> nobody tests.

## Do not persist from the updater

```typescript avoid title="settings.updater.ts"
on(settingsActions.change, (state, change) => {
  state.density.set(change.density);
  localStorage.setItem('settings', JSON.stringify(change));
});
```

```typescript prefer title="settings.updater.ts"
on(settingsActions.change, (state, change) => {
  state.density.set(change.density);
});
```

The first version works, right up to the test that has no `localStorage`, the
server-side render that has no `window`, and the day two updaters both want to
write. Storage is a side effect; effects are where side effects go.

## Server-side rendering

`localStorage` does not exist while the page is being prerendered. Keep the
access inside the service, as above, and guard it there so nothing else has to
know:

```typescript fragment title="settings.storage.ts"
private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

public read(): Settings | null {
  if (!this.isBrowser) {
    return null;
  }
  // …
}
```

## A worked example

This documentation site does exactly this for its own theme: a
`ThemeEnvironment` service owns the storage and the media query, an effect
writes the choice after the updater has taken it, and an app initializer
dispatches the stored value at startup. It is in
`projects/ngx-statewise-docs/src/app/ui-state/` in the repository.

## Key notes

- Storage lives in a service, called from an effect, never from an updater.
- Restoring is a dispatch with its own action, not a direct write.
- Wrap every storage call in `try`/`catch` and guard the platform: blocked
  storage is a normal condition, not an error worth surfacing.

See also: [Effects](/guide/effects), [Managers](/guide/managers).
