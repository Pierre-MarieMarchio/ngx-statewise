import { Component, input } from '@angular/core';
import { Task } from '../../models';
import { MatCardModule } from '@angular/material/card';
import { KanbanCardComponent } from '@shared/app-common/components';

@Component({
  selector: 'app-task-kanban-card',
  imports: [MatCardModule, KanbanCardComponent],
  templateUrl: './task-kanban-card.component.html',
  styleUrl: './task-kanban-card.component.scss',
})
export class TaskKanbanCardComponent {
  public task = input.required<Task>();
}
