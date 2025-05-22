import { Injectable } from '@angular/core';
import { isSerializable } from '../utils/json.utils';

@Injectable({
  providedIn: 'root',
})
export abstract class LocalStorageService {
  protected setItem<T>(key: string, value: T): void {
    const stringValue = isSerializable(value)
      ? JSON.stringify(value)
      : String(value);

    try {
      localStorage.setItem(key, stringValue);
    } catch (error) {
      console.error('LocalStorage setItem error:', error);
    }
  }

  protected getItem<T = unknown>(key: string): T | string | null {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  protected removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  protected clear(): void {
    localStorage.clear();
  }
}
