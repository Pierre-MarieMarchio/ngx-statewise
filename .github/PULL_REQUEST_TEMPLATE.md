### What this changes

One or two sentences. If it fixes an issue, `Closes #123`.

---

### Why

The reasoning a reviewer cannot get from the diff: what the previous behaviour
cost, or what the alternative was and why it lost.

---

### How it was verified

- [ ] `npm run check` exits 0 from a clean tree
- [ ] New behaviour is covered by a test that **fails without the change** —
      a test that passes either way is decoration
- [ ] Library coverage still at 100% statements / lines / functions

For a bug fix, say what the probe or failing test printed before the fix.

---

### Before merging

- [ ] Base is `dev` (only `dev` → `next` → `main` pull requests target the release branches)
- [ ] Commits follow conventional commits, and a breaking change carries a
      `BREAKING CHANGE:` footer — not just a `!`
- [ ] **Merge with a merge commit, never a squash** — squashing loses the
      footers that decide the next version
