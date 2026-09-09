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

A state is a plain injectable class holding the data of one feature. You do not
register it with a store or declare its shape: the fields you put on the class
are the state.

Use signals for those fields, so components track them on their own. Plain
properties work too, at the cost of updating the view yourself.

## With signals

Signals are the recommended shape. A component reading one of them in its template re-renders when an updater writes to it, with nothing to subscribe to and nothing to tear down.

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

Updaters write plain properties too. A component reading one has no way of knowing it changed, so you mark it for check yourself. You can mix both in the same class, which is occasionally useful for data no template reads.

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
