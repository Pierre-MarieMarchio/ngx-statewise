import { HttpEvent, HttpRequest } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { Observable, catchError, delay, tap, throwError } from 'rxjs';

import { FakeBackend } from './fake-backend';

/**
 * Traces every call the fake backend answers, in development only. A
 * `console.table` per request is a useful thing to watch while building and
 * noise on a deployed page.
 */
function trace(label: string, detail: Record<string, unknown>): void {
  if (!isDevMode()) {
    return;
  }

  console.log(`[FakeBackendInterceptor] ${label}`);
  console.table(detail);
}

export function fakeBackendInterceptor(
  request: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> {
  const { method, url, body } = request;
  trace('Request ⏩', { method, url, body });

  return new FakeBackend(request as HttpRequest<Record<string, unknown>>)
    .handleRequest()
    .pipe(
      delay(200), // delay to simulate server latency
      tap((response) => {
        const { status, url, body } = response;
        trace('Response success ✅', { status, url, body });
      }),
      catchError((error: unknown) => {
        trace('Response error ❌', { url, error });

        return throwError(() => error);
      }),
    );
}
