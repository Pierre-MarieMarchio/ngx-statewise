import {
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import {
  KanbanCardComponent,
  type KanbanCardData,
} from './kanban-card/kanban-card.component';
import type {
  KanbanColumn,
  KanbanMove,
  KanbanReorder,
} from './kanban-column.model';

/**
 * A board of columns whose cards move between them, by drag or by keyboard.
 *
 * It knows nothing of what an item is: the caller says what the columns are,
 * what a card looks like, and what to do when one moves. And it holds no
 * state — a move is reported, never applied. That is what lets an optimistic
 * update render the move without this component keeping a copy of anything.
 */
@Component({
  selector: 'app-kanban',
  imports: [
    CdkDropList,
    KanbanCardComponent,
    MatGridListModule,
    NgTemplateOutlet,
  ],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanComponent<Item extends KanbanCardData> {
  public columns = input.required<readonly KanbanColumn<Item>[]>();

  /** Namespaces the drop-list ids, so two boards on one page stay apart. */
  public group = input('');

  /** The kind of card, which is what colours its indicator. */
  public cardTypeFor = input<(item: Item) => string>(() => '');

  /** What a screen reader reads on a card. */
  public labelFor = input.required<(item: Item) => string>();

  /** Named `kanbanCard` in the caller's content, and handed each item. */
  public readonly cardBody =
    contentChild.required<TemplateRef<{ $implicit: Item }>>('kanbanCard');

  public itemMoved = output<KanbanMove<Item>>();
  public columnReordered = output<KanbanReorder<Item>>();

  /** Every list of this board, which is what connects them to each other. */
  public readonly dropListIds = computed(() =>
    this.columns().map((column) => this.dropListId(column.id)),
  );

  public dropListId(columnId: string): string {
    const group = this.group();

    return group === '' ? `kanban_${columnId}` : `kanban_${group}_${columnId}`;
  }

  /**
   * Each list carries its column in `cdkDropListData`, so a drop reads its
   * source and its target directly instead of parsing them back out of an id.
   */
  public onDrop(event: CdkDragDrop<KanbanColumn<Item>>): void {
    const from = event.previousContainer.data;
    const to = event.container.data;

    if (from.id === to.id) {
      const items = [...to.items];
      moveItemInArray(items, event.previousIndex, event.currentIndex);
      this.columnReordered.emit({ columnId: to.id, items });

      return;
    }

    this.itemMoved.emit({
      item: from.items[event.previousIndex],
      from: from.id,
      to: to.id,
    });
  }

  /** The keyboard path, which the CDK does not provide. */
  public moveByKeyboard(
    item: Item,
    column: KanbanColumn<Item>,
    offset: number,
  ): void {
    const columns = this.columns();
    const target =
      columns.findIndex((candidate) => candidate.id === column.id) + offset;

    if (target < 0 || target >= columns.length) {
      return;
    }

    this.itemMoved.emit({ item, from: column.id, to: columns[target].id });
  }
}
