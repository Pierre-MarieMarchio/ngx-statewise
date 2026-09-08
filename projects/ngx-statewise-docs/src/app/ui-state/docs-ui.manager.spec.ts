import { TestBed } from '@angular/core/testing';
import { drainEffects, provideStatewiseTesting } from 'ngx-statewise/testing';
import { DocsUiEffect } from './docs-ui.effect';
import { DocsUiManager } from './docs-ui.manager';
import { docsUiUpdater } from './docs-ui.updater';
import { THEME_CLASSES, THEME_STORAGE_KEY } from './theme';

describe('DocsUiManager', () => {
  let manager: DocsUiManager;

  const themeClass = () =>
    THEME_CLASSES.find((candidate) =>
      document.documentElement.classList.contains(candidate),
    );

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(...THEME_CLASSES);

    TestBed.configureTestingModule({
      providers: [
        provideStatewiseTesting({
          effects: [DocsUiEffect],
          updaters: [docsUiUpdater],
        }),
      ],
    });

    manager = TestBed.inject(DocsUiManager);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(...THEME_CLASSES);
  });

  it('starts on the dark theme, with the navigation closed', () => {
    expect(manager.theme()).toBe('dark');
    expect(manager.navOpen()).toBe(false);
  });

  it('flips the theme, then flips it back', () => {
    manager.toggleTheme();
    expect(manager.theme()).toBe('light');

    manager.toggleTheme();
    expect(manager.theme()).toBe('dark');
  });

  it('writes the new theme to storage and to the document', async () => {
    manager.toggleTheme();
    await drainEffects();

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(themeClass()).toBe('light');
  });

  it('leaves exactly one theme class on the document', async () => {
    manager.toggleTheme();
    await drainEffects();
    manager.toggleTheme();
    await drainEffects();

    const applied = THEME_CLASSES.filter((candidate) =>
      document.documentElement.classList.contains(candidate),
    );

    expect(applied).toEqual(['dark']);
  });

  it('adopts the theme found in storage', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    manager.restoreTheme();
    await drainEffects();

    expect(manager.theme()).toBe('light');
    expect(themeClass()).toBe('light');
  });

  it('keeps the default when storage holds nothing usable', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'chartreuse');

    manager.restoreTheme();
    await drainEffects();

    expect(manager.theme()).toBe('dark');
  });

  it('opens and closes the navigation', () => {
    manager.toggleNav();
    expect(manager.navOpen()).toBe(true);

    manager.toggleNav();
    expect(manager.navOpen()).toBe(false);

    manager.toggleNav();
    manager.closeNav();
    expect(manager.navOpen()).toBe(false);
  });
});
