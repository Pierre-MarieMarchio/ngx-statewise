import { computed, Injectable, Signal } from '@angular/core';
import { Task, User } from '@shared/app-common/models';

@Injectable({
  providedIn: 'root',
})
export class TaskFilterService {
  
  public getPersonalTasks(
    tasks: Signal<Task[]>,
    user: Signal<User | null>
  ): Signal<Task[]> {
    return computed(() => {
      const allTasks = tasks() || [];
      const currentUser = user();
      const currentUserId = currentUser?.userId;

      if (!currentUserId || !allTasks.length) {
        return [];
      }

      return allTasks.filter((task) =>
        task.assignedUserIds?.includes(currentUserId)
      );
    });
  }

  public getTasksByUserId(
    tasks: Signal<Task[]>,
    userId: Signal<string | null>
  ): Signal<Task[]> {
    return computed(() => {
      const allTasks = tasks() || [];
      const currentUserId = userId();

      if (!currentUserId || !allTasks.length) {
        return [];
      }

      return allTasks.filter((task) =>
        task.assignedUserIds?.includes(currentUserId)
      );
    });
  }

  public getTasksByStatus(
    tasks: Signal<Task[]>,
    status: Signal<string | null>
  ): Signal<Task[]> {
    return computed(() => {
      const allTasks = tasks() || [];
      const currentStatus = status();

      if (!currentStatus || !allTasks.length) {
        return allTasks;
      }

      return allTasks.filter((task) => task.status === currentStatus);
    });
  }

  public getTasksByPriority(
    tasks: Signal<Task[]>,
    priority: Signal<string | null>
  ): Signal<Task[]> {
    return computed(() => {
      const allTasks = tasks() || [];
      const currentPriority = priority();

      if (!currentPriority || !allTasks.length) {
        return allTasks;
      }

      return allTasks.filter((task) => task.priority === currentPriority);
    });
  }

  public getTasksByOrganization(
    tasks: Signal<Task[]>,
    organizationId: Signal<string | null>
  ): Signal<Task[]> {
    return computed(() => {
      const allTasks = tasks() || [];
      const currentOrgId = organizationId();

      if (!currentOrgId || !allTasks.length) {
        return allTasks;
      }

      return allTasks.filter((task) => task.organizationId === currentOrgId);
    });
  }

  public getTasksByProject(
    tasks: Signal<Task[]>,
    projectId: Signal<string | null>
  ): Signal<Task[]> {
    return computed(() => {
      const allTasks = tasks() || [];
      const currentProjectId = projectId();

      if (!currentProjectId || !allTasks.length) {
        return allTasks;
      }

      return allTasks.filter((task) => task.projectId === currentProjectId);
    });
  }

  public searchTasks(
    tasks: Signal<Task[]>,
    searchTerm: Signal<string>
  ): Signal<Task[]> {
    return computed(() => {
      const allTasks = tasks() || [];
      const term = searchTerm()?.toLowerCase().trim();

      if (!term || !allTasks.length) {
        return allTasks;
      }

      return allTasks.filter(
        (task) =>
          task.title?.toLowerCase().includes(term) ||
          task.description?.toLowerCase().includes(term) ||
          task.status?.toLowerCase().includes(term) ||
          task.priority?.toLowerCase().includes(term)
      );
    });
  }

  public sortTasks(
    tasks: Signal<Task[]>,
    sortBy: Signal<keyof Task | null>,
    sortDirection: Signal<'asc' | 'desc'>
  ): Signal<Task[]> {
    return computed(() => {
      const allTasks = tasks() || [];
      const sortField = sortBy();
      const direction = sortDirection();

      if (!sortField || !allTasks.length) {
        return allTasks;
      }

      return [...allTasks].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === bValue) return 0;

        if (aValue === undefined) return direction === 'asc' ? -1 : 1;
        if (bValue === undefined) return direction === 'asc' ? 1 : -1;

        const aVal = typeof aValue === 'string' ? aValue.toLowerCase() : aValue;
        const bVal = typeof bValue === 'string' ? bValue.toLowerCase() : bValue;

        const comparison = aVal > bVal ? 1 : -1;

        return direction === 'desc' ? -comparison : comparison;
      });
    });
  }
}
