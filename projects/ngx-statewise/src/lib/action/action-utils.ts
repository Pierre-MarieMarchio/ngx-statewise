import { EmptyPayloadFn, ValuePayloadFn } from './action-type';

export const emptyPayload: EmptyPayloadFn = () => undefined;
export function payload<T>(): ValuePayloadFn<T> {
  return (p: T) => p;
}
