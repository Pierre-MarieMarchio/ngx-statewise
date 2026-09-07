/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters -- the
   identity trick relies on those single-use type parameters. */

/** True only when both types are identical, variance and all. */
export type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false;

/* eslint-enable @typescript-eslint/no-unnecessary-type-parameters */

/** Compile-time assertion: instantiating it with `false` is a type error. */
export type Expect<Value extends true> = Value;
