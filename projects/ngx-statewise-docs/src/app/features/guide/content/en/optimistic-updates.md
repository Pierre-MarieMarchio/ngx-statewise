---
slug: optimistic-updates
title:
  en: Optimistic updates
  fr: Mise à jour optimiste
  es: Actualización optimista
  de: Optimistische Aktualisierung
  pt-BR: Atualização otimista
summary:
  en: Writing before the server agrees, and putting it back if it does not.
  fr: Écrire avant l’accord du serveur, et revenir en arrière sinon.
  es: Escribir antes de que el servidor acepte, y deshacerlo si no.
  de: Schreiben, bevor der Server zustimmt, und zurücknehmen, wenn nicht.
  pt-BR: Escrever antes de o servidor concordar, e desfazer se não.
---

# Optimistic updates

Writing the state before the server has agreed, and putting it back if the
server disagrees.

This is the flow the library is shaped for. The state is written synchronously,
the effect leaves with the new value already on screen, and a failure comes
back as another action through the same path.

## The shape

Three actions: the intent, and the two answers.

```typescript title="task.actions.ts"
export const taskActions = defineActionsGroup({
  source: 'TASK',
  events: {
    toggleDone: payload<string>(), // the task id
    toggleConfirmed: payload<string>(),
    toggleReverted: payload<{ id: string; reason: string }>(),
  },
});
```

The updater flips the value immediately, and flips it back if the revert
arrives:

```typescript title="task.updater.ts"
export const taskUpdater = defineUpdater(TaskStates, (on) => {
  on(taskActions.toggleDone, (state, id) => {
    state.items.update((items) => flipDone(items, id));
    state.pending.update((pending) => new Set(pending).add(id));
  });

  on(taskActions.toggleConfirmed, (state, id) => {
    state.pending.update((pending) => without(pending, id));
  });

  on(taskActions.toggleReverted, (state, { id, reason }) => {
    state.items.update((items) => flipDone(items, id));
    state.pending.update((pending) => without(pending, id));
    state.lastError.set(reason);
  });
});
```

The effect sends what the updater has already written, and answers with one of
the two:

<!-- prettier-ignore -->
```typescript title="task.effect.ts"
@Injectable({ providedIn: 'root' })
export class TaskEffect {
  private readonly states = inject(TaskStates);
  private readonly api = inject(TaskApi);

  public readonly toggleDoneEffect = createEffect(
    taskActions.toggleDone,
    async (id) => {
      // Already flipped, so this is the value the user is looking at.
      const task = this.states.items().find((item) => item.id === id);

      try {
        await this.api.setDone(id, task?.done ?? false);
        return taskActions.toggleConfirmed(id);
      } catch (error) {
        return taskActions.toggleReverted({ id, reason: String(error) });
      }
    },
  );
}
```

## Why the revert is a different action

```typescript avoid title="task.effect.ts"
catch {
  // The same action that triggered this effect.
  return taskActions.toggleDone(id);
}
```

Returning the triggering action flips the value back **and starts the effect
again**. That call fails too, and flips again. The cascade bound stops the loop
at 50 actions and raises the path it took, so the symptom is an error naming
the cycle rather than a dead tab.

```typescript prefer title="task.effect.ts"
catch (error) {
  return taskActions.toggleReverted({ id, reason: String(error) });
}
```

A separate action ends the chain: its updater undoes the change, and no effect
listens for it.

## Keeping the pending set

`pending` is not decoration. It is what lets the interface show the row as
in-flight, and what stops a second toggle from racing the first:

```typescript title="task.manager.ts"
public toggleDone(id: string): void {
  if (this.states.pending().has(id)) {
    return;
  }

  this.statewise.dispatch(taskActions.toggleDone(id));
}
```

Guarding in the manager rather than the updater keeps the updater a plain
function of the action: given this action, the state becomes that. A guard
inside it would make the same action mean two different things.

## When the answer carries data

If the server returns the authoritative row, take it rather than trusting the
optimistic guess. The confirmation then carries the row instead of the id, so
the action is the thing that changes first:

```typescript title="task.actions.ts"
toggleConfirmed: payload<Task>(), // was payload<string>()
```

```typescript title="task.updater.ts"
on(taskActions.toggleConfirmed, (state, task) => {
  state.items.update((items) => replace(items, task));
  state.pending.update((pending) => without(pending, task.id));
});
```

The effect returns `taskActions.toggleConfirmed(saved)` with whatever the API
answered. The optimistic write was for the eye; the confirmation is for the
record.

## Key notes

- Three actions: intent, confirmation, revert. Never reuse the intent as the
  revert.
- The effect reads the already-written state to know what to send.
- A pending set in state gives you both the spinner and the guard.
- Awaiting the whole thing is `dispatchAsync`; a fire-and-forget toggle is
  `dispatch`.

See also: [Cancelling a request](/guide/cancelling-requests) for the other
half of this problem, and [Effects](/guide/effects).
