# Introduction

## Description

ngx-statewise is a state management solution for Angular applications, providing a more lightweight and intuitive alternative to libraries like NgRx and NGXS, while maintaining a clear and predictable architecture for managing your application's state.

Unlike NgRx, which is built around observables and actions dispatched through a store, or NGXS, which uses a Redux-like approach with actions and state mutations, ngx-statewise leverages Angular's native signals for a more declarative and reactive state management experience. Signals allow for automatic component updates when the state changes, making it easier and more efficient to manage reactive data in your Angular applications.

While NgRx and NGXS are powerful solutions, they tend to be more complex and require developers to work with higher levels of boilerplate code. On the other hand, ngx-statewise offers a more streamlined approach that integrates seamlessly with Angular's ecosystem, allowing developers to focus on business logic rather than infrastructure.

## Core Concept

The core concept of ngx-statewise revolves around a clear, predictable flow of actions and state updates:

- **Action with Payload**: Everything starts with an action that carries a payload with the necessary data.

- **Manager Dispatches Action**: The manager dispatches this action, which triggers the appropriate updater.

- **Updater Updates State When Registered**: If an updater handles the action, it modifies the state before effects run. Effect-only actions are also valid.

- **Effect Handles Side Effects**: After the state is updated, any related effect is triggered to handle side operations (like API calls).

- **Chain of Actions**: Effects can dispatch additional actions, which in turn can trigger other updaters and effects, creating a chain of operations if needed.

### Paradigm Shift

While NgRx and NGXS implement state management based on redux-style patterns with stores, reducers, and selectors, ngx-statewise introduces a paradigm shift:

- **Direct Action Flow**: Instead of actions going through a centralized store, actions are directly linked to their updaters and effects, making the flow more intuitive.

- **Signals over Observables**: Rather than relying heavily on RxJS observables for everything, ngx-statewise leverages Angular's native signals for state reactivity.

- **Explicit Separation**: The library enforces a clear distinction between state updates (updaters) and side effects, making the codebase easier to maintain.

- **Simplified Boilerplate**: The amount of code required to implement state management is significantly reduced compared to NgRx or NGXS.

The unidirectional flow (Action → optional Updater → Effect → Potentially More Actions) in ngx-statewise makes state management predictable and easier to debug. When an updater handles an action, its state update is completed before effects execute. Actions without an updater are valid when they exist only to trigger effects.

### Considerations

- **Complex Queries**: For extremely complex state derivation and selection patterns, the built-in capabilities might need to be extended.

- **Action-First Approach**: Unlike some libraries where effects can be triggered independently, ngx-statewise requires an action to be dispatched first, which then updates state before triggering effects. This enforces a specific flow that might require adjustment in thinking if coming from other patterns.

It's important to note that while ngx-statewise supports dispatching individual actions, its primary design intention is to leverage cascading effects - where one action triggers an updater, which leads to an effect, which may then dispatch additional actions, creating powerful chains of operations. This design philosophy particularly shines in complex applications with interconnected state changes and sequential operations.

The clear, unidirectional flow with emphasis on cascading effects makes ngx-statewise particularly well-suited for applications where predictable state updates need to trigger complex chains of operations, especially when these operations need to be executed in a specific order while maintaining state consistency throughout the process.

## Features

- 🔄 Flexible state management: Supports Angular signals for automatic reactivity and updates. You can also use regular properties if you prefer manual reactivity.
- 🧩 Modular and maintainable architecture: Easily extendable with actions, effects, and handlers.
- 📦 Predictable state updates: Updates are dispatched through actions, with clear and explicit state mutations.
- 🚀 Effects: Handles asynchronous operations and side effects in a clean and declarative way.
- 🔍 Easy to debug: State changes and effects are transparent and easy to track.
