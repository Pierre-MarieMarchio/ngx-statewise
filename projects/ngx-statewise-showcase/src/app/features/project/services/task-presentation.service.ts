import { Injectable } from '@angular/core';
import { TaskPriority, TaskStatus } from '../models';

const STATUS_ICONS: Record<TaskStatus, string> = {
  todo: 'pending',
  'in-progress': 'hourglass_empty',
  done: 'check_circle',
};

const PRIORITY_ICONS: Record<TaskPriority, string> = {
  low: 'keyboard_arrow_down',
  medium: 'remove',
  high: 'keyboard_arrow_up',
};

/**
 * How a task reads on screen.
 *
 * A component's class drives its view; what a status or a priority looks like
 * is a rule about the domain, so it belongs in a service — and it used to sit
 * in a component, in `shared/`, where a second view could not reach it.
 *
 * A lookup keyed by the union rather than a `switch`: the compiler then checks
 * every member is covered, where the four switches each carried an unreachable
 * `default:` to satisfy a compiler that had already been satisfied.
 *
 * The colours are deliberately not here. They are three custom properties in
 * `styles.scss` — `--priority-low`, `--priority-medium`, `--priority-high` —
 * because the kanban card takes a hue solid for its border while the details
 * panel derives a translucent fill from the same value, and a TypeScript
 * constant cannot be shared with a stylesheet.
 */
@Injectable({ providedIn: 'root' })
export class TaskPresentationService {
  public statusIcon(status: TaskStatus): string {
    return STATUS_ICONS[status];
  }

  public priorityIcon(priority: TaskPriority): string {
    return PRIORITY_ICONS[priority];
  }

  /**
   * Still `fr-FR`, like the panel that shows it. The whole panel is in French
   * under `lang="en"`, and that is one change to make in one place rather than
   * a locale corrected here and the surrounding labels left behind.
   */
  public formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /** A task already done is never late, whatever its due date says. */
  public isOverdue(dueDate?: string, status?: TaskStatus): boolean {
    if (!dueDate || status === 'done') {
      return false;
    }

    return new Date(dueDate) < new Date();
  }
}
