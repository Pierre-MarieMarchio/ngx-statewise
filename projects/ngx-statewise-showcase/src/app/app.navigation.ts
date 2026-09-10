import { NavigationItem } from '@shared/ui/nav-shell';

export const navigationItems: NavigationItem[] = [
  {
    icon: 'Dashboard',
    label: 'Dashboard',
    route: 'home',
  },
  {
    icon: 'Task_Alt',
    label: 'Task',
    route: 'task',
  },
  {
    icon: 'Monitor_Heart',
    label: 'State',
    route: 'state',
  },
  {
    icon: 'History',
    label: 'History',
    route: 'history',
  },
  {
    /*
     * The guide lives with the library rather than in here. This showcase is
     * what exercises it; explaining it is the documentation's job, and keeping
     * a copy of that explanation in a TypeScript literal only made two things
     * to keep in step.
     */
    icon: 'Menu_Book',
    label: 'Docs',
    href: 'https://github.com/Pierre-MarieMarchio/ngx-statewise#readme',
  },
];
