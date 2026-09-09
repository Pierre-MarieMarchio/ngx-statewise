import { routes } from './app.routes';

describe('the application routes', () => {
  const titles = routes.map((route) => route.title);

  /**
   * All six read `Ngx-Statewise` before, so a tab, a bookmark and a history
   * entry said nothing about where you were.
   */
  it('gives every page a title of its own', () => {
    expect(new Set(titles).size).toBe(routes.length);
  });

  it('keeps the application name in each of them', () => {
    for (const title of titles) {
      expect(title).toContain('Ngx-Statewise');
    }
  });
});
