import type { IUpdator } from '../../updator';

/**
 * State carried by one root dispatch and its cascading actions.
 *
 * The execution is deliberately local to the call chain. It must never be
 * registered globally or looked up by action type.
 */
export interface DispatchExecution {
  readonly contextOrUpdator?: object | IUpdator<any>;
}

export function createDispatchExecution<S>(
  contextOrUpdator?: object | IUpdator<S>
): DispatchExecution {
  return { contextOrUpdator };
}
