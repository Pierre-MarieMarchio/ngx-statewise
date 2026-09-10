import { Injectable } from '@angular/core';
import { TaskPriority, TaskStatus } from '../models';

const STATUS_ICONS: Record<TaskStatus, string> = {
  todo: 'pending',
  'in-progress': 'hourglass_empty',
  done: 'check_circle',
};

/**
 * How a status is spelled for a reader.
 *
 * `titlecase` over the stored value gives "In-progress", and a column header
 * gave "in-progress", where the hyphen is an artefact of the value being a key.
 * Written out once here, and read by the badge, the board and anything else
 * that shows one.
 */
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  'in-progress': 'In progress',
  done: 'Done',
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
 * is a rule about the domain, so it belongs in a service. It used to sit in a
 * component, in `shared/`, where a second view could not reach it.
 *
 * A lookup keyed by the union rather than a `switch`: the compiler then checks
 * every member is covered, where the four switches each carried an unreachable
 * `default:` to satisfy a compiler that had already been satisfied.
 *
 * The colours are deliberately not here. They are three custom properties in
 * `styles.scss`, namely `--priority-low`, `--priority-medium` and
 * `--priority-high`, because the kanban card takes a hue solid for its border
 * while the details
 * panel derives a translucent fill from the same value, and a TypeScript
 * constant cannot be shared with a stylesheet.
 */
@Injectable({ providedIn: 'root' })
export class TaskPresentationService {
  public statusIcon(status: TaskStatus): string {
    return STATUS_ICONS[status];
  }

  public statusLabel(status: TaskStatus): string {
    return STATUS_LABELS[status];
  }

  public priorityIcon(priority: TaskPriority): string {
    return PRIORITY_ICONS[priority];
  }

  /**
   * `en-US`, like the document that shows it. It used to be `fr-FR` under a
   * `lang="en"` page whose details panel was itself in French. That was a
   * locale and six labels that had to move together, and did.
   */
  public formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
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
