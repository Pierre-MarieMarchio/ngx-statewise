/** Base structure accepted by the execution engine. */
export interface Action<Type extends string = string, Payload = unknown> {
  type: Type;
  payload?: Payload;
}

/** An action carrying no data. */
export interface EmptyAction<Type extends string> {
  type: Type;
}

/** An action carrying a payload. */
export interface ActionWithPayload<Type extends string, Payload> {
  type: Type;
  payload: Payload;
}
