type AsciiLowercase =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z';

type AsciiUppercase = Uppercase<AsciiLowercase>;

/**
 * Mirrors `toScreamingSnakeCase` at type level, so an action type is known as
 * a string literal and not merely as `string`.
 */
export type ScreamingSnakeCase<
  Value extends string,
  Previous extends string = '',
> = string extends Value
  ? Uppercase<Value>
  : Value extends `${infer Current}${infer Rest}`
    ? `${Previous extends AsciiLowercase
        ? Current extends AsciiUppercase
          ? '_'
          : ''
        : ''}${Uppercase<Current>}${ScreamingSnakeCase<Rest, Current>}`
    : '';

/** The type name an event of an action group produces. */
export type GroupActionType<
  Source extends string,
  EventName extends string,
> = `${Uppercase<Source>}_${ScreamingSnakeCase<EventName>}`;

/** The type name a standalone action produces. */
export type SingleActionType<Source extends string> = `${Source}_ACTION`;

/**
 * Converts a camelCase or PascalCase name to SCREAMING_SNAKE_CASE.
 *
 * @example
 * toScreamingSnakeCase('loadFailure') // 'LOAD_FAILURE'
 * toScreamingSnakeCase('UserLogin')   // 'USER_LOGIN'
 */
export function toScreamingSnakeCase(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
}
