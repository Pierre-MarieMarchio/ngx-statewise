export type EmptyPayloadFn = () => undefined;
export type ValuePayloadFn<T> = (payload: T) => T;
export type SingleAction<T> = T extends undefined
  ? EmptyPayloadFn
  : ValuePayloadFn<T>;
  
export type Action = {
  type: string;
  payload?: any;
};
