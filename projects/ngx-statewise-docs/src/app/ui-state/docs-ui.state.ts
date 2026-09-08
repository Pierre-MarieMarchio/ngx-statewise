import { Injectable, signal } from '@angular/core';
import { DEFAULT_THEME, type Theme } from './theme';

@Injectable({ providedIn: 'root' })
export class DocsUiState {
  public theme = signal<Theme>(DEFAULT_THEME);
  /** The sidebar is a drawer below the layout breakpoint, always open above it. */
  public navOpen = signal(false);
}
