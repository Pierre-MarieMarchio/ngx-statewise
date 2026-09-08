---
name: Bug
about: Report something that behaves differently from what the guide says
title: 'fix: '
labels: bug
---

### **Description**:

What happens, and what you expected instead. One sentence each is enough.

---

### Versions:

- `ngx-statewise`:
- `@angular/core`:
- Node:
- Browser, or SSR / zoneless if relevant:

---

### Reproduction:

The smallest code that shows it. An updater and an effect are usually enough —
paste them rather than describing them.

```ts
// actions, updater, effect, and the dispatch that misbehaves
```

Steps:

1.
2.
3.

---

### What you observed:

Include the exact error text if there is one. A dispatch that does nothing is
worth reporting too: say which manager you dispatched through, and which
manager owns the updater for that action type — a misrouted dispatch is
reported to the `ErrorHandler` in production and throws in development.

---

### Anything already ruled out:

Optional, but it saves a round trip. For example: the action type is owned by
the manager you dispatched through, the effect is registered, the coverage of
your own updater is not the issue.
