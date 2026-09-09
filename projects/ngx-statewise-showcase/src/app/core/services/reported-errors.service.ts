import { Injectable, signal } from '@angular/core';

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

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
