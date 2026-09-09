---
slug: states
title:
  en: States
  fr: States
  es: States
  de: States
  pt-BR: States
summary:
  en: Where the data lives, with signals or plain properties.
  fr: Où vivent les données, en signals ou en propriétés simples.
  es: Dónde viven los datos, con signals o propiedades simples.
  de: Wo die Daten liegen, mit Signals oder einfachen Feldern.
  pt-BR: Onde os dados moram, com signals ou propriedades simples.
---

# States

A plain injectable class holding the data of one feature. There is nothing to
register and no shape to declare — the fields on the class are the state.

```typescript title="auth.states.ts"
@Injectable({ providedIn: 'root' })
export class AuthStates {
  public user = signal<User | null>(null);
  public isLoggedIn = signal(false);
  public isLoading = signal(false);
  public hasError = signal(false);
}
```

That is the whole thing. No base class, no interface to implement, no entry in
a store. An [updater](/guide/updaters) names this class as its token and gets
the instance handed to it.

## Use signals

A component reading a signal in its template re-renders when an updater writes
to it, with nothing to subscribe to and nothing to tear down. This is the
shape to reach for.

Derived values are `computed`, on the state or on the manager — there is no
selector layer, and none is needed:

```typescript title="auth.states.ts"
@Injectable({ providedIn: 'root' })
export class AuthStates {
  public user = signal<User | null>(null);
  public readonly displayName = computed(() => this.user()?.name ?? 'Guest');
}
```

## Plain properties also work

Updaters write plain properties too. The cost is that a component reading one
has no way of knowing it changed, so you mark it for check yourself.

```typescript avoid title="auth.states.ts"
@Injectable({ providedIn: 'root' })
export class AuthStates {
  public user: User | null = null;
  public isLoading = false;
}
```

```typescript prefer title="auth.states.ts"
@Injectable({ providedIn: 'root' })
export class AuthStates {
  public user = signal<User | null>(null);
  public isLoading = signal(false);
}
```

Mixing the two in one class is legitimate for data no template reads — an
access token, a cursor, a cache key. Reach for it deliberately, not by default.

## What belongs here

State holds data. It holds no methods that change it, no API calls and no
navigation.

```typescript avoid title="auth.states.ts"
@Injectable({ providedIn: 'root' })
export class AuthStates {
  public user = signal<User | null>(null);

  public logIn(user: User): void {
    this.user.set(user);
  }
}
```

A method like that is a second way in, and it is the one nothing else can see.
The updater is the only writer, and that is what makes a wrong value traceable
to one place.

```typescript prefer title="auth.updater.ts"
export const authUpdater = defineUpdater(AuthStates, (on) => {
  on(loginActions.success, (state, session) => {
    state.user.set(session.user);
  });
});
```

## Key notes

- One state class per feature, injectable, usually `providedIn: 'root'`.
- Signals unless you have a reason; `computed` for anything derived.
- No writers other than updaters. No asynchronous work.
- Two managers of the same feature share the instance the injector gives them.
  Scoping is decided by where the manager is provided, not here — see
  [attaching updaters](/guide/updaters#attaching-updaters).

Next: [Actions](/guide/actions).
