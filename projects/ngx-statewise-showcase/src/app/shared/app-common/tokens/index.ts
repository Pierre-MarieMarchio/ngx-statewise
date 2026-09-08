/*
 * Why these tokens exist.
 *
 * The guide says an effect must not return another feature's action: inject
 * that feature's manager and call it instead. Doing it by importing the class
 * would import its barrel, which exports that feature's effect too — and that
 * effect imports back this way, so the cycle is in the shape of the imports
 * rather than in the code.
 *
 * An interface and a token in a module neither feature owns break it, and
 * `app.config.ts` binds them with `useExisting` so there is still one
 * instance. The interface also states what one feature actually needs of
 * another, which is what the test doubles in `src/testing` implement.
 *
 * Within one feature, the class is injected directly — the login page, both
 * auth guards and the access-token interceptor all do. There is no cycle to
 * break there, and a token would only add indirection.
 */

export { AUTH_MANAGER } from './auth-manager/auth-manager.token';
export type { IAuthManager } from './auth-manager/auth-manager.interface';

export { PROJECT_MANAGER } from './project-manager/project-manager.token';
export type { IProjectManager } from './project-manager/project-manager.interface';

export { TASK_MANAGER } from './task-manager/task-manager.token';
export type { ITaskManager } from './task-manager/task-manager.interface';
