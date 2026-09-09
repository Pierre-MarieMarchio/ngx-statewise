import { Injectable, signal } from '@angular/core';
import {
  DEFAULT_THEME_CHOICE,
  FALLBACK_THEME,
  type Theme,
  type ThemeChoice,
} from '../../theme';

@Injectable({ providedIn: 'root' })
export class DocsUiState {
  /** What the reader picked, which may be `system`. */
  public themeChoice = signal<ThemeChoice>(DEFAULT_THEME_CHOICE);
  /** What the operating system currently asks for. */
  public systemTheme = signal<Theme>(FALLBACK_THEME);
  /** The sidebar is a drawer below the layout breakpoint, always open above it. */
  public navOpen = signal(false);
}
