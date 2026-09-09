import type { Routes } from '@angular/router';
import { GUIDE_PAGES } from './features/guide/guide-pages';
import { GuidePageComponent } from './pages/guide/guide-page.component';
import { HomeComponent } from './pages/home/home.component';
import { DEFAULT_LOCALE, LOCALE, LOCALES } from './core/i18n';
import { ShellComponent } from './pages/shell/shell.component';

const FIRST_PAGE = GUIDE_PAGES[0].slug;

/**
 * One subtree per locale, each providing its `LOCALE` so the shell and the
 * pages under it are localised without deriving anything from the URL. Every
 * path is static, which is what lets the build discover and prerender them
 * all without a route-parameter list to keep in step.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: `/${DEFAULT_LOCALE.code}`,
  },
  ...LOCALES.map((locale) => ({
    path: locale.code,
    component: ShellComponent,
    providers: [{ provide: LOCALE, useValue: locale }],
    children: [
      {
        path: '',
        pathMatch: 'full' as const,
        component: HomeComponent,
      },
      {
        path: 'guide',
        pathMatch: 'full' as const,
        redirectTo: `/${locale.code}/guide/${FIRST_PAGE}`,
      },
      ...GUIDE_PAGES.map((page) => ({
        path: `guide/${page.slug}`,
        component: GuidePageComponent,
        // Bound to the component's `page` input by `withComponentInputBinding()`.
        data: { page },
      })),
    ],
  })),
  {
    path: '**',
    redirectTo: `/${DEFAULT_LOCALE.code}`,
  },
];
