import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

/**
 * What one card of a board looks like. It draws the frame and the indicator;
 * the caller's template fills the body.
 *
 * It carries no `cdkDrag` of its own. The board puts one on this host, because
 * the host is what the drop list holds and what carries the card's label and
 * its id — so it has to be what moves.
 *
 * An attribute selector on an `<li>`, so a column can be a real `<ul>`: the
 * host used to be an `<app-kanban-card>` carrying `role="listitem"` inside a
 * `<div role="list">`, which is two elements telling a screen reader what two
 * native tags would have said on their own.
 */
@Component({
  selector: 'li[appKanbanCard]',
  imports: [MatCardModule],
  templateUrl: './kanban-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './kanban-card.component.scss',
})
export class KanbanCardComponent {
  public cardType = input.required<string>();
}

export interface KanbanCardData {
  id: string;
}
