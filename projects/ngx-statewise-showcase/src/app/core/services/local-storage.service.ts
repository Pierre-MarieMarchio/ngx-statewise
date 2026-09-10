import { ErrorHandler, inject, Injectable } from '@angular/core';
import { isSerializable } from '../utils/json.utils';

/**
 * Every access is guarded: a browser with storage blocked throws on read as
 * well as on write, and a read happens at bootstrap, before anything can
 * recover from it.
 *
 * Failures go to the `ErrorHandler` rather than the console, so whatever the
 * application plugged into it hears about them, a logger or Sentry included.
 */
@Injectable({
  providedIn: 'root',
})
export abstract class LocalStorageService {
  private readonly errorHandler = inject(ErrorHandler);

  protected setItem<T>(key: string, value: T): void {
    const stringValue = isSerializable(value)
      ? JSON.stringify(value)
      : String(value);

    try {
      localStorage.setItem(key, stringValue);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  protected getItem<T = unknown>(key: string): T | string | null {
    const raw = this.read(key);

    if (raw === null) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw;
    }
  }

  protected removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  /** A blocked read is a missing value, not a crash at startup. */
  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      this.errorHandler.handleError(error);

      return null;
    }
  }
}
