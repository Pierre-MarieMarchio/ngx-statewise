# ngx-statewise

A lightweight and intuitive state management library for Angular. Simpler than
NgRx, more structured than DIY.

**📖 [Read the documentation](https://pierre-mariemarchio.github.io/ngx-statewise/)**
— the guide lives on the site, which is its single source of truth. The
[package README](projects/ngx-statewise/README.md) is the overview npm shows.

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
| [`projects/ngx-statewise`](projects/ngx-statewise)                   | The library                             |
| [`projects/ngx-statewise/testing`](projects/ngx-statewise/testing)   | The `ngx-statewise/testing` entry point |
| [`projects/ngx-statewise-showcase`](projects/ngx-statewise-showcase) | A demo application, not published       |
| [`projects/ngx-statewise-docs`](projects/ngx-statewise-docs)         | The documentation site, not published   |

## Working on the repo

```bash
npm install
npm start          # serve the showcase
npm run start:docs # serve the documentation site
npm run check      # format, lint, tests with coverage, build everything
```

`npm run check` is what a commit is expected to pass.
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs it on every pull
request and again on `dev`, and
[`.github/workflows/release.yml`](.github/workflows/release.yml) runs it once
more before anything is tagged or published.

The library is held to full statement, line and function coverage and to 95%
branch coverage, currently met at 100%. The gate is the `coverageThresholds` of
its `test` target in [`angular.json`](angular.json).

[`.github/workflows/deploy-docs.yml`](.github/workflows/deploy-docs.yml)
prerenders the documentation site and publishes it to GitHub Pages on every
push to `main`.

Coming from 0.6.x? See
[Migrating](https://pierre-mariemarchio.github.io/ngx-statewise/guide/migration).

## Contributing

Contributions are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) is the whole
workflow — the `dev` → `next` → `main` promotion, the commit convention, and the
two rules that break a release if they are ignored. Read the first section even
if you read nothing else.

Bugs and features go through the [issue templates](.github/ISSUE_TEMPLATE);
a vulnerability goes through [SECURITY.md](SECURITY.md), never a public issue.
By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

GPL v3
