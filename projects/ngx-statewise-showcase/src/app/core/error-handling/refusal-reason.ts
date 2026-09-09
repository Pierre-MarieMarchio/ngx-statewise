import { HttpErrorResponse } from '@angular/common/http';

/** What the fake backend puts in the body of a refusal. */
interface RefusalBody {
  readonly message?: unknown;
}

/**
 * The sentence a refused request came back with.
 *
 * A form that cannot repeat the reason cannot help: "something went wrong"
 * leaves the user to guess between an empty title and a name already taken.
 * So the server's own words travel, and the fallback is only for a failure
 * that carried none — a network that never answered, say.
 */
export function refusalReason(
  error: unknown,
  fallback = 'The server refused the request.',
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const { message } = (error.error ?? {}) as RefusalBody;

  return typeof message === 'string' && message.length > 0 ? message : fallback;
}
