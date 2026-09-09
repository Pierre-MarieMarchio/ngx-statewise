import type { Theme, ThemeChoice } from './theme';

/** What to paint, given what the reader picked and what the system asks for. */
export function resolveTheme(choice: ThemeChoice, system: Theme): Theme {
  return choice === 'system' ? system : choice;
}
