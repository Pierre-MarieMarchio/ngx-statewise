import { TestBed } from '@angular/core/testing';
import { drainEffects, provideStatewiseTesting } from 'ngx-statewise/testing';
import { DocsUiEffect } from './docs-ui.effect';
import { DocsUiManager } from './docs-ui.manager';
import { docsUiUpdater } from './docs-ui.updater';
import { ThemeEnvironment } from '../../services/theme-environment.service';
import {
  THEME_CLASSES,
  THEME_STORAGE_KEY,
  type Theme,
} from '../../models/theme.model';

/** Lets a spec decide what the operating system is asking for. */
function fakeSystem(theme: Theme) {
  const listeners: ((theme: Theme) => void)[] = [];
  const environment = TestBed.inject(ThemeEnvironment);

  vi.spyOn(environment, 'systemTheme').mockReturnValue(theme);
  vi.spyOn(environment, 'watchSystem').mockImplementation((onChange) => {
    listeners.push(onChange);
    return () => undefined;
  });

  return { change: (next: Theme) => listeners.forEach((l) => l(next)) };
}

describe('DocsUiManager', () => {
  let manager: DocsUiManager;

  const appliedClass = () =>
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
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove(...THEME_CLASSES);
  });

  it('starts on the system theme, with the navigation closed', () => {
    fakeSystem('light');
    manager.start();

    expect(manager.themeChoice()).toBe('system');
    expect(manager.theme()).toBe('light');
    expect(manager.navOpen()).toBe(false);
  });

  it('follows the system while the choice is system', async () => {
    const system = fakeSystem('dark');
    manager.start();
    await drainEffects();

    expect(manager.theme()).toBe('dark');

    system.change('light');
    await drainEffects();

    expect(manager.theme()).toBe('light');
    expect(appliedClass()).toBe('light');
  });

  it('stops following the system once a theme is picked', async () => {
    const system = fakeSystem('dark');
    manager.start();

    manager.chooseTheme('light');
    await drainEffects();

    expect(manager.theme()).toBe('light');

    system.change('dark');
    await drainEffects();

    // The reader asked for light; the system changing does not override that.
    expect(manager.theme()).toBe('light');
    expect(appliedClass()).toBe('light');
  });

  it('stores the choice, including system', async () => {
    fakeSystem('dark');
    manager.start();

    manager.chooseTheme('light');
    await drainEffects();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    manager.chooseTheme('system');
    await drainEffects();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('adopts the stored choice at startup', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    fakeSystem('dark');

    manager.start();
    await drainEffects();

    expect(manager.themeChoice()).toBe('light');
    expect(appliedClass()).toBe('light');
  });

  it('ignores a stored value it does not recognise', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'chartreuse');
    fakeSystem('dark');

    manager.start();

    expect(manager.themeChoice()).toBe('system');
  });

  it('leaves exactly one theme class on the document', async () => {
    fakeSystem('dark');
    manager.start();

    manager.chooseTheme('light');
    await drainEffects();
    manager.chooseTheme('dark');
    await drainEffects();

    const applied = THEME_CLASSES.filter((candidate) =>
      document.documentElement.classList.contains(candidate),
    );

    expect(applied).toEqual(['dark']);
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
