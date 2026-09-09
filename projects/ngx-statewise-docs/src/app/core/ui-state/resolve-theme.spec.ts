import { resolveTheme } from './resolve-theme';

describe('resolveTheme', () => {
  it('paints what was picked, when something was picked', () => {
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
  });

  it('defers to the system only for the system choice', () => {
    expect(resolveTheme('system', 'light')).toBe('light');
    expect(resolveTheme('system', 'dark')).toBe('dark');
  });
});
