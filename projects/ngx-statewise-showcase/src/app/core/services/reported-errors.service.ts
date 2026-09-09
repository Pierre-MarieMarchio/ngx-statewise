import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { refusalReason } from '../error-handling/refusal-reason';

/** One failure the application chose to surface rather than swallow. */
export interface ReportedError {
  readonly at: string;
  readonly message: string;
}

/**
 * What the application does with a failure instead of dropping it in the
 * console: keeps it as state, so a view can render it like any other state.
 *
 * Everything reaches here through Angular's `ErrorHandler`, which is the
 * channel the library already reports to — a misrouted dispatch, an effect
 * that answered nothing while promising one, the cause behind a failure
 * action.
 */
@Injectable({ providedIn: 'root' })
export class ReportedErrors {
  /** Enough to see what just happened, few enough to stay readable. */
  private static readonly LIMIT = 20;

  private readonly reported = signal<readonly ReportedError[]>([]);

  public readonly all = this.reported.asReadonly();

  public record(error: unknown): void {
    const entry: ReportedError = {
      at: new Date().toLocaleTimeString(),
      message: messageOf(error),
    };

    this.reported.update((known) =>
      [entry, ...known].slice(0, ReportedErrors.LIMIT),
    );
  }

  public clear(): void {
    this.reported.set([]);
  }
}

/**
 * The sentence a failure gets in the panel.
 *
 * `HttpErrorResponse` **implements** `Error` without extending it, so an
 * `instanceof Error` test never catches one and `String()` rendered every
 * refused request as `[object Object]` — in the one panel whose whole job is
 * naming what failed. It gets asked first, and its server's own words are
 * preferred over the transport's sentence: "a project is already called
 * \"HR Platform\"" says more than "Http failure response … 400 Bad Request".
 */
function messageOf(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return refusalReason(error, error.message);
  }

  if (error instanceof Error) {
    return error.message;
  }

  // Neither, and still worth reading: anything carrying a string `message` is
  // saying what went wrong, and `String()` would throw that away as well.
  const { message } = (error ?? {}) as { message?: unknown };

  return typeof message === 'string' && message.length > 0
    ? message
    : String(error);
}
