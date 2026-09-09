import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * Everything is prerendered: GitHub Pages serves files, and there is no server
 * to render anything on request.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
