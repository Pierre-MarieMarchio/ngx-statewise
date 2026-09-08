import type { Routes } from '@angular/router';
import { GUIDE_PAGES } from './guide/guide-pages';
import { GuidePageComponent } from './guide/guide-page.component';
import { HomeComponent } from './home/home.component';

const FIRST_PAGE = GUIDE_PAGES[0].slug;

/**
 * One static route per guide page, derived from the registry. Static paths are
 * what lets the build discover and prerender every page without a route
 * parameter list to keep in step.
 */
export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    title: 'ngx-statewise — state management for Angular',
  },
  {
    path: 'guide',
    pathMatch: 'full',
    redirectTo: `/guide/${FIRST_PAGE}`,
  },
  ...GUIDE_PAGES.map((page) => ({
    path: `guide/${page.slug}`,
    component: GuidePageComponent,
    // Bound to the component's `page` input by `withComponentInputBinding()`.
    data: { page },
  })),
  {
    path: '**',
    redirectTo: '',
  },
];
