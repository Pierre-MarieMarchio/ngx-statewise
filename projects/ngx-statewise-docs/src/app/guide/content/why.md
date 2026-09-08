# Why ngx-statewise

## Benefits

- **Intuitive Action Flow**: Unlike traditional Redux-based libraries, ngx-statewise implements a direct, intuitive flow where actions connect directly to updaters and effects. This reduces cognitive overhead and makes the state management pattern easier to understand and implement.

- **Signals-First Approach**: Leveraging Angular's native signals for reactive state management, ngx-statewise offers superior performance with automatic UI updates when state changes. This eliminates the need for manual subscription handling that's common with Observable-based solutions.

- **Enforced Unidirectional Flow**: The library's design enforces a predictable sequence (Action → Updater → Effect → Potentially More Actions) that makes debugging and reasoning about application state much simpler. By ensuring state is updated before effects run, all side effects work with the latest state data.

- **Cascading Effects**: ngx-statewise excels at creating powerful chains of operations through its cascading effects design. One action can trigger state updates which lead to effects that dispatch additional actions, making complex workflows easier to orchestrate and maintain.

- **Clear Separation of Concerns**: The library enforces explicit boundaries between state updates (updaters) and side effects, leading to more maintainable code that's easier to test and reason about.

## When to use it

- **Signal-Based Applications**: If you're building new Angular applications or migrating existing ones to leverage the power of Angular signals, ngx-statewise provides the ideal state management solution that's specifically designed to work harmoniously with signals.

- **Applications with Sequential Workflows**: For applications that require predictable chains of operations where one action leads to state changes followed by side effects that may trigger additional actions, ngx-statewise's cascading effects model provides elegant solutions.

- **Projects Requiring Predictable State Updates**: The enforced sequence where state is always updated before effects run makes ngx-statewise particularly well-suited for applications where consistency between state and side effects is critical.

- **Medium to Large Angular Applications**: The modular architecture scales well for larger applications with complex state management needs while keeping the codebase organized and maintainable.
