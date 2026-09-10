# Changelog

# [1.0.0-beta.0](https://github.com/Pierre-MarieMarchio/ngx-statewise/compare/ngx-statewise%400.6.4...ngx-statewise%401.0.0-beta.0) (2026-09-10)

* refactor(dispatch)!: inject the action history instead of reading it off a handle ([e3f7237](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/e3f72379ee4c0ce89010e9dd20dbbdd360e547a7))
* feat(effect)!: run an effect only for the manager owning its action ([12fdc87](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/12fdc878782ace722363d6e5ad102bbb574535b2))
* refactor!: rebuild the library around scoped dispatch ([e101582](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/e101582dffa13722c246f5d513ff0fda78ebed22))

### Bug Fixes

* bound the depth of a cascade ([193afad](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/193afadfdbf5b209b2d3b871fd01fb49a9e3a510))
* close the reliability and security findings the gate fails on ([ecd4a48](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/ecd4a486941b0c3acbf8b665d4deeb848eb2f539))
* **dispatch:** report a misrouted dispatch in production ([be4e110](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/be4e1108e4663dc27fe73269f609f6a820453c6b))
* **docs:** correct the claims the code contradicts ([d6af1fa](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/d6af1fabba552c6b9ca9d4b132062f83dbd82318))
* **effect:** recognize a promise an effect returns by its shape ([cefcabe](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/cefcabe0650ffda412c3175b4bc69fc934c33fc7))
* take the last five findings at their word ([16297ae](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/16297aece803a5633607ea98a6b8ce025da04ea9))

### Code Refactoring

* stop exporting fifteen plumbing types ([bb8779e](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/bb8779e2d3c886940a1d7b27fd59f583a0880fbc))

### Features

* ask an interceptor before applying an updater ([8bdbe11](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/8bdbe11a766c69dd3e68b5e568bcf2d10c8a8750))
* await a cascade across manager boundaries ([8a60d59](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/8a60d594d2d9c0df6b90bcd5a82174dc99386f97))
* **dispatch:** give the history an envelope of its own and a way to redact ([c3dd122](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/c3dd122598a2f96bdbea5fffd92bb133034c624d))
* **effect:** give effects a concurrency policy and a cancellation signal ([08cec62](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/08cec62895c9101313da28fc344d0ebf759ff209))
* **effect:** let an effect declare that it always answers with an action ([8fad2f4](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/8fad2f43b4ec77787eeaaada763e7c3e659b7a65))
* give a history entry the cascade path that led to it ([234c513](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/234c5137bedb4d5d3b6f1f451c8dbe4825550823))
* give interceptor classes an option of their own ([be64869](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/be64869cfb5d5504437d2bf3d33deff7ccafd32f))
* refuse a second provideStatewise instead of detaching in silence ([9d95fbe](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/9d95fbed04b5c0e2727bc7fb1599faa7b86816b7))
* wire the two flags of a request flow in one call ([512dd29](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/512dd29ff147309995acd12a8f03a14dfdecd4f0))

### BREAKING CHANGES

* `recordedActions()` is gone from the `Statewise` handle.
  Inject the history instead: `inject(ActionHistory).snapshot()` returns the
  same array. `ActionHistory` is exported from `ngx-statewise`.
* an effect registered for an action type owned by an
  updater no longer runs when that action is dispatched through another
  manager; that dispatch is reported as misrouted and does nothing at all,
  its effects included. Dispatch through the owning manager, or declare the
  updater globally with provideStatewise({ updaters: [...] }).
* dispatchAsync resolves later than it used to. A dispatch whose
  effect calls another feature's manager from a synchronous handler now waits for
  that manager's cascade as well. Code that relied on the promise settling early
  — a spinner cleared before the reloads it triggered had finished, a test
  asserting on state between the two — sees the new timing. The ad hoc per-manager
  wait this defect forced consumers to write (waitForEffect after an awaited
  dispatch, one method per manager) is no longer needed for a synchronous handler,
  and can go.
* fifteen types are no longer exported from ngx-statewise —
  ActionCreator, ActionCreatorsGroup, CreatorFromDefinition, EmptyActionCreator,
  PayloadActionCreator, PayloadDefinition, EmptyPayloadFn, ValuePayloadFn,
  GroupActionType, SingleActionType, ActionWithPayload, EmptyAction,
  ResolvedActions, On and StateUpdate. Every one described a value that is
  inferred, so an annotation naming one can be deleted rather than replaced. The
  exception is an updater handler extracted into a constant, which needs
  `: undefined` on its return instead of `StateUpdate`.
* snapshot() answers readonly HistoryEntry[] instead of
  readonly Action[], and record() takes the cascade path as a second argument.
  Read entry.action.type where you read action.type, and entry.action.payload
  where you read action.payload. The array itself is unchanged: still plain,
  still oldest first, still capped by history.limit.
* updater classes are replaced by defineUpdater, the
  global dispatch functions by injectStatewise, and provideEffects and
  provideUpdators by provideStatewise options. defineSingleAction returns
  the creator itself, waitForEffect no longer accepts a raw string, and
  StatewiseRef, UpdaterDefinition and SWEffects are renamed to Statewise,
  Updater and EffectOutcome. See the migration guide in the README.

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.6.4](https://github.com/Pierre-MarieMarchio/ngx-statewise/compare/ngx-statewise@0.6.4-beta.1...ngx-statewise@0.6.4) (2025-06-24)

**Note:** Version bump only for package ngx-statewise





## [0.6.4-beta.1](https://github.com/Pierre-MarieMarchio/ngx-statewise/compare/ngx-statewise@0.6.4-beta.0...ngx-statewise@0.6.4-beta.1) (2025-06-24)

**Note:** Version bump only for package ngx-statewise





## [0.6.4-beta.0](https://github.com/Pierre-MarieMarchio/ngx-statewise/compare/ngx-statewise@0.6.3-beta.0...ngx-statewise@0.6.4-beta.0) (2025-06-24)

**Note:** Version bump only for package ngx-statewise




## [0.6.3](https://github.com/Pierre-MarieMarchio/ngx-statewise/compare/ngx-statewise@0.6.3-beta.0...ngx-statewise@0.6.3) (2025-06-24)


**Note:** Version bump only for package ngx-statewise





## [0.6.3-beta.0](https://github.com/Pierre-MarieMarchio/ngx-statewise/compare/ngx-statewise@0.6.2-beta.0...ngx-statewise@0.6.3-beta.0) (2025-05-06)

**Note:** Version bump only for package ngx-statewise





## [0.6.2](https://github.com/Pierre-MarieMarchio/ngx-statewise/compare/ngx-statewise@0.6.2-beta.0...ngx-statewise@0.6.2) (2025-05-06)

**Note:** Version bump only for package ngx-statewise





## [0.6.2-beta.0](https://github.com/Pierre-MarieMarchio/ngx-statewise/compare/ngx-statewise@0.6.1-beta.0...ngx-statewise@0.6.2-beta.0) (2025-05-05)


### Bug Fixes

* **manager:** fixed duplicated cascading effect in DispatchHandler ([3873234](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/38732346645e33b50da5d45ba9bc027b075a441e))





## [0.6.1](https://github.com/Pierre-MarieMarchio/ngx-statewise/compare/ngx-statewise@0.6.1-beta.0...ngx-statewise@0.6.1) (2025-05-05)

**Note:** Version bump only for package ngx-statewise





## [0.6.1-beta.0](https://github.com/Pierre-MarieMarchio/ngx-statewise/compare/ngx-statewise@0.6.0-beta.0...ngx-statewise@0.6.1-beta.0) (2025-05-05)

**Note:** Version bump only for package ngx-statewise





# [0.6.0](https://github.com/Pierre-MarieMarchio/ngx-statewise/compare/ngx-statewise@0.6.0-beta.0...ngx-statewise@0.6.0) (2025-05-05)

**Note:** Version bump only for package ngx-statewise





# 0.6.0-beta.0 (2025-04-28)


### Features

* added automatic versionnig ([3d67ac2](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/3d67ac26f27a5039a422249b8e13eb88c2706d27))





# 0.4.0-beta.0 (2025-04-28)


### Features

* added automatic versionnig ([3d67ac2](https://github.com/Pierre-MarieMarchio/ngx-statewise/commit/3d67ac26f27a5039a422249b8e13eb88c2706d27))
