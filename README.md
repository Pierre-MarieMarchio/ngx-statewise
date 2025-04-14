# ngx-statewise

A lightweight and intuitive state management library for Angular.

## Description

ngx-statewise is a state management solution for Angular applications, offering a lighter and easier-to-use alternative to libraries like NgRx or NGXS, while maintaining a clear and predictable architecture for managing your application's state.

## Features

- 🔄 Flexible state management (supports Angular signals and regular properties)
- 🧩 Modular and maintainable architecture
- 📦 Predictable state updates
- 🚀 Effects for handling asynchronous operations
- 🔍 Easy to debug

## Installation

```bash
npm install ngx-statewise --save
```

## Key Concepts

### 1. States

States represent the current state of your application or a specific feature. They can be defined using Angular signals or regular properties.

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthStates {
  public user = signal<User | null>(null);
  public accessToken: string | null = null;  // Regular property
  public isLoggedIn = signal(false);
  public isLoading = signal(false);
  public asError = signal(false);
}
```

### 2. Actions

Actions are events that trigger state changes. They can be defined individually or as a group. Action groups typically follow a request-success-failure pattern for asynchronous operations.

#### Action Group with the Request-Success-Failure Pattern

```typescript
export const loginActions = defineActionsGroupe({
  source: 'LOGIN',
  events: {
    request: payload<LoginSubmit>(),  // With interface payload
    success: payload<LoginResponses>(),  // With interface payload
    failure: emptyPayload,  // No payload
  },
});
```

#### Action Group with Inline Payload Types

```typescript
export const updateProfileActions = defineActionsGroupe({
  source: 'UPDATE_PROFILE',
  events: {
    request: payload<{ name: string, bio: string }>(),  // Inline payload definition
    success: emptyPayload,  // No payload
    failure: payload<string>(),  // String error message payload
  },
});
```

#### Single Action

```typescript
export const logoutAction = defineSingleAction('LOGOUT', emptyPayload);  // No payload
export const selectItemAction = defineSingleAction('SELECT_ITEM', payload<number>());  // With payload
```

### 3. Updators

Updators are responsible for updating the state in response to actions. They define how the state should change based on received actions.

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthUpdator implements IUpdator<AuthStates> {
  public readonly state = inject(AuthStates);

  public readonly updators: UpdatorRegistry<AuthStates> = {
    LOGIN_REQUEST: (state) => {
      state.isLoading.set(true);
      state.asError.set(false);
    },
    LOGIN_SUCCESS: (state, payload: LoginResponses) => {
      state.user.set({
        userId: payload.userId,
        userName: payload.userName,
        email: payload.email,
      });
      state.isLoggedIn.set(true);
      state.isLoading.set(false);
    },
    LOGIN_FAILURE: (state) => {
      state.user.set(null);
      state.isLoggedIn.set(false);
      state.asError.set(true);
      state.isLoading.set(false);
    },
    LOGOUT_ACTION: (state) => {
      state.user.set(null);
      state.isLoggedIn.set(false);
      state.asError.set(false);
      state.isLoading.set(false);
    },
  };
}
```

### 4. Effects

Effects handle asynchronous operations like API calls. They react to actions and can trigger other actions, typically following the request-success-failure pattern.

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private readonly authRepository = inject(AuthRepositoryService);
  private readonly authTokenService = inject(AuthTokenService);
  private readonly router = inject(Router);
  
  public readonly loginEffect = createEffect(
    loginActions.request,  // Triggered by the request action
    (payload) => {
      return this.authRepository.login(payload).pipe(
        map((res) => {
          // On success, return the success action with payload
          this.router.navigate(['/']);
          this.authTokenService.setAccessToken(res.body?.accessToken!);
          return loginActions.success(res.body!);  // Success action
        }),
        catchError(() => of(loginActions.failure()))  // Failure action on error
      );
    }
  );
  
  public readonly logoutEffect = createEffect(
    logoutAction.action,
    () => {
      this.router.navigate(['/']);
      return EMPTY;  // No additional action needed
    }
  );
}
```

### 5. Managers

Managers expose the public APIs for interacting with the state. They allow components to access states and dispatch actions.

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthManager implements IAuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly authEffects = inject(AuthEffects);
  private readonly authUpdator = inject(AuthUpdator);
  
  // Expose states
  public readonly user = this.authStates.user;
  public readonly isLoggedIn = this.authStates.isLoggedIn;
  public readonly isLoading = this.authStates.isLoading;
  public readonly asError = this.authStates.asError;
  
  // Define methods
  public login(credential: LoginSubmit): void {
    dispatch(
      loginActions.request(credential),
      this.authUpdator
    );
  }
  
  public logout() {
    dispatch(
      logoutAction.action(),
      this.authUpdator
    );
  }
}
```

## Usage Example

### Defining States

```typescript
@Injectable({
  providedIn: 'root',
})
export class TodoStates {
  public todos = signal<Todo[]>([]);
  public isLoading = signal(false);
  public error = signal<string | null>(null);
  public selectedTodoId: number | null = null;  // Regular property
}
```

### Defining Actions

```typescript
export const todoActions = defineActionsGroupe({
  source: 'TODO',
  events: {
    load: emptyPayload,  // No payload needed
    loadSuccess: payload<Todo[]>(),  // With Todo[] payload
    loadFailure: payload<string>(),  // With error message payload
    add: payload<Todo>(),  // With Todo payload
    remove: payload<number>(),  // With id payload
    select: payload<number>(),  // With id payload
  },
});
```

### Defining Updators

```typescript
@Injectable({
  providedIn: 'root',
})
export class TodoUpdator implements IUpdator<TodoStates> {
  public readonly state = inject(TodoStates);

  public readonly updators: UpdatorRegistry<TodoStates> = {
    TODO_LOAD: (state) => {
      state.isLoading.set(true);
      state.error.set(null);
    },
    TODO_LOAD_SUCCESS: (state, payload: Todo[]) => {
      state.todos.set(payload);
      state.isLoading.set(false);
    },
    TODO_LOAD_FAILURE: (state, payload: string) => {
      state.error.set(payload);
      state.isLoading.set(false);
    },
    TODO_ADD: (state, payload: Todo) => {
      const currentTodos = state.todos();
      state.todos.set([...currentTodos, payload]);
    },
    TODO_REMOVE: (state, payload: number) => {
      const currentTodos = state.todos();
      state.todos.set(currentTodos.filter(todo => todo.id !== payload));
    },
    TODO_SELECT: (state, payload: number) => {
      // Example of updating a regular property
      state.selectedTodoId = payload;
    },
  };
}
```

### Creating Effects

```typescript
@Injectable({
  providedIn: 'root',
})
export class TodoEffects {
  private readonly todoService = inject(TodoService);
  
  public readonly loadTodosEffect = createEffect(
    todoActions.load,
    () => {
      return this.todoService.getTodos().pipe(
        map(todos => todoActions.loadSuccess(todos)),
        catchError(error => of(todoActions.loadFailure(error.message)))
      );
    }
  );
  
  public readonly addTodoEffect = createEffect(
    todoActions.add,
    (todo) => {
      return this.todoService.addTodo(todo).pipe(
        map(() => todoActions.load()),
        catchError(error => of(todoActions.loadFailure(error.message)))
      );
    }
  );
}
```

### Usage in Components

```typescript
@Component({
  selector: 'app-todo-list',
  template: `
    @if (isLoading()) {
      <div>Loading...</div>
    }
    @if (error()) {
      <div>{{ error() }}</div>
    }
    <ul>
      @for (todo of todos(); track todo.id) {
        <li [class.selected]="todo.id === todoManager.selectedTodoId"
            (click)="selectTodo(todo.id)">
          {{ todo.title }}
          <button (click)="removeTodo(todo.id)">Delete</button>
        </li>
      }
    </ul>
    <button (click)="loadTodos()">Refresh</button>
  `,
})
export class TodoListComponent {
  private todoManager = inject(TodoManager);
 
  public todos = this.todoManager.todos;
  public isLoading = this.todoManager.isLoading;
  public error = this.todoManager.error;
 
  loadTodos(): void {
    this.todoManager.loadTodos();
  }
 
  removeTodo(id: number): void {
    this.todoManager.removeTodo(id);
  }
 
  selectTodo(id: number): void {
    this.todoManager.selectTodo(id);
  }
}
```

## Benefits

- **Simplicity**: Simpler and more intuitive API than NgRx or NGXS
- **Performance**: Optional use of Angular signals for optimized change detection
- **Modularity**: Clear organization of states, actions, and effects
- **Testability**: Architecture that facilitates unit testing
- **Flexibility**: Works with both signals and regular properties, allowing for gradual adoption

## When to Use ngx-statewise

- Medium to large Angular applications
- Applications with complex state management needs
- Teams looking for a balance between structure and simplicity
- Projects that want to leverage Angular signals but need more structure

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on GitHub.

## License

GPL v3
