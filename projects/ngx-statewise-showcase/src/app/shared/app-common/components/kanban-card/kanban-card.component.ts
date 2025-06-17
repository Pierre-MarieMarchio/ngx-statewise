import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-kanban-card',
  imports: [MatCardModule, CdkDrag],
  templateUrl: './kanban-card.component.html',
  styleUrl: './kanban-card.component.scss',
})
export class KanbanCardComponent<T extends KanbanCardData> {
  public data = input.required<T>();
  public cardType = input.required<string>();
}

export interface KanbanCardData {
  id: string;
  [key: string]: any;
}
