import { ErrorHandler, inject, Injectable, isDevMode } from '@angular/core';
import { ReportedErrors } from '../services';

/**
 * Angular's default `ErrorHandler` hands everything to the console, which on a
 * deployed page means nowhere. This one keeps the failure as state so the
 * state page can show it, and still logs while developing.
 */
@Injectable()
export class ShowcaseErrorHandler implements ErrorHandler {
  private readonly reported = inject(ReportedErrors);

  public handleError(error: unknown): void {
    this.reported.record(error);

    if (isDevMode()) {
      console.error(error);
    }
  }
}
