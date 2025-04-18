import { Action } from '../action/action-type';
import { UpdatorRegistry } from './updator-interfaces';

export function update<S>(
  state: S,
  action: Action,
  updators: UpdatorRegistry<S>
): void {
  const handler = updators[action.type];
  console.log('handler ', handler);
  if (handler) {
    handler(state, action.payload);
  } else {
    console.warn(`No handler for action type: ${action.type}`);
  }
}

