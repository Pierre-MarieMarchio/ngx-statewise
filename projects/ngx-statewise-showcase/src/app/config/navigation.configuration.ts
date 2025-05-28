import { NavigationItem } from '@app/core/models';

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
    icon: 'Folder_Open',
    label: 'Project',
    route: 'project',
  },
  {
    icon: 'Group',
    label: 'Team',
    route: 'team',
  },
];
