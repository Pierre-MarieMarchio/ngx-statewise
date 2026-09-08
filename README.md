# ngx-statewise

A lightweight and intuitive state management library for Angular. Simpler than
NgRx, more structured than DIY.

**📖 [Read the guide](projects/ngx-statewise/README.md)** — the complete
documentation lives with the package, so what you read here and what npm ships
are the same document.

```bash
npm install ngx-statewise
```

## What it looks like

State is a plain injectable holding signals. An action carries what changed, an
updater applies it, an effect handles everything else.

```typescript
// The actions
export const loginActions = defineActionsGroup({
  source: 'login',
  events: {
    request: payload<Credentials>(),
    success: payload<User>(),
    failure: emptyPayload,
  },
});

// The state update — synchronous, and the only place state changes
export const authUpdater = defineUpdater(AuthState, (on) => {
  on(loginActions.request, (state) => state.isLoading.set(true));
  on(loginActions.success, (state, user) => {
    state.user.set(user);
    state.isLoading.set(false);
  });
});

// The side effect — returns the next action
@Injectable({ providedIn: 'root' })
export class AuthEffect {
  private readonly repository = inject(AuthRepository);

  private readonly login = createEffect(loginActions.request, async (credentials) => {
    try {
      return loginActions.success(await this.repository.login(credentials));
    } catch {
      return loginActions.failure();
    }
  });
}

// The manager — the only thing your components talk to
@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly state = inject(AuthState);
  private readonly statewise = injectStatewise(authUpdater);

  public readonly user = this.state.user.asReadonly();
  public readonly isLoading = this.state.isLoading.asReadonly();

  // Resolves once the whole cascade is over, nested effects included
  public login(credentials: Credentials): Promise<void> {
    return this.statewise.dispatchAsync(loginActions.request(credentials));
  }
}
```

The flow is one-way: **action → updater → effect → possibly more actions**. The
state is settled before any effect runs, and `dispatchAsync` awaits the entire
chain.

## Where things are

| Path                                                                 | What it is                              |
| -------------------------------------------------------------------- | --------------------------------------- |
| [`projects/ngx-statewise`](projects/ngx-statewise)                   | The library, and the guide              |
| [`projects/ngx-statewise/testing`](projects/ngx-statewise/testing)   | The `ngx-statewise/testing` entry point |
| [`projects/ngx-statewise-showcase`](projects/ngx-statewise-showcase) | A demo application, not published       |

## Working on the repo

```bash
npm install
npm start          # serve the showcase
npm run check      # format, lint, tests with coverage, build everything
```

`npm run check` is what a commit is expected to pass, and running it locally is
the only thing that enforces it: no workflow runs on a pull request or on `dev`.
[`.github/workflows/versioning.yml`](.github/workflows/versioning.yml) runs it
on a push to `main` or `next` only, as the first step of the release.

The library is held to full statement, line and function coverage and to 95%
branch coverage, currently met at 100%. The gate is the `coverageThresholds` of
its `test` target in [`angular.json`](angular.json).

Coming from 0.6.x? See
[Migrating](projects/ngx-statewise/README.md#migrating-from-06x).

## Contributing

Contributions are welcome. Feel free to open issues or submit pull requests.

## License

GPL v3
