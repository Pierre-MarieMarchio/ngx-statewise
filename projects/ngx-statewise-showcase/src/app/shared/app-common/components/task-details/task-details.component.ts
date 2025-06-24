import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { Task, TaskPriority, TaskStatus } from '@shared/app-common/models';

@Component({
  selector: 'app-task-details',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    MatTabsModule,
  ],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.scss',
})
export class TaskDetailsComponent {
  selectedTask = input<Task | null>();
  close = output<void>();
  modify = output<Task>();
  delete = output<string>();

  onCloseClick() {
    this.close.emit();
  }

  onModifyClick() {
    const task = this.selectedTask();
    if (task) {
      this.modify.emit(task);
    }
  }

  onDeleteClick() {
    const task = this.selectedTask();
    if (task) {
      this.delete.emit(task.id);
    }
  }

  getStatusColor(status: TaskStatus): string {
    switch (status) {
      case 'todo':
        return 'primary';
      case 'in-progress':
        return 'accent';
      case 'done':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case 'low':
        return 'primary';
      case 'medium':
        return 'accent';
      case 'high':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case 'low':
        return 'keyboard_arrow_down';
      case 'medium':
        return 'remove';
      case 'high':
        return 'keyboard_arrow_up';
      default:
        return 'remove';
    }
  }

  getStatusIcon(status: TaskStatus): string {
    switch (status) {
      case 'todo':
        return 'pending';
      case 'in-progress':
        return 'hourglass_empty';
      case 'done':
        return 'check_circle';
      default:
        return 'pending';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  isDueDateOverdue(dueDate?: string, status?: TaskStatus): boolean {
    if (!dueDate) return false;

    if (new Date(dueDate) < new Date() && status === 'done') {
      return false;
    }

    return new Date(dueDate) < new Date();
  }
}
