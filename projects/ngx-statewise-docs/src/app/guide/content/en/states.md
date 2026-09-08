# States

A state is a plain injectable class holding the data of one feature. There is
no store to register it with and no shape to declare: whatever fields you put
on it _are_ the state.

Its fields are usually signals, so components track them on their own. Plain
properties work too, at the cost of updating the view yourself.

## With signals

This is the recommended shape. A component reading one of these signals in its template re-renders when an updater writes to it, with nothing to subscribe to and nothing to tear down.

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthStates {
  public user = signal<User | null>(null);
  public isLoggedIn = signal(false);
  public isLoading = signal(false);
  public asError = signal(false);
}
```

## With plain properties

Nothing forces signals. Updaters write plain properties just as happily — but a component reading one has no way of knowing it changed, so you are back to marking it for check yourself. Mixing both in the same class is allowed, and occasionally useful for data no template reads.

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthStates {
  public user: User | null = null;
  public accessToken: string | null = null;
  public isLoggedIn = false;
  public isLoading = false;
  public hasError = false;
}
```
