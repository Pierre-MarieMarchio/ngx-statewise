# States

States represent the current state of your application or a specific feature. They can be defined using Angular signals for reactivity, or as regular properties for manual reactivity.

## Using Angular signals

Signals are the recommended approach as they automatically trigger component updates when state changes. Here's an example of how you can define state using signals:

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

## Using regular properties

You can still define state as regular properties if you prefer not to use signals. However, you will need to manually update your components when the state changes. Signals make state updates automatic and reactive, which simplifies component reactivity.

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

## Key Notes

- Signals are reactive and recommended for most use cases. Components will auto-update when signal values change.

- Regular properties require manual component updates.

- You can mix both in the same state class depending on your needs.

- Signals simplify reasoning about UI updates and reduce boilerplate in Angular components.
