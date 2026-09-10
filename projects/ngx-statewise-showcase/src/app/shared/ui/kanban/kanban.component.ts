import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
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
 * state: a move is reported, never applied. That is what lets an optimistic
 * update render the move without this component keeping a copy of anything.
 */
@Component({
  selector: 'app-kanban',
  imports: [CdkDrag, CdkDropList, KanbanCardComponent, NgTemplateOutlet],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanComponent<Item extends KanbanCardData> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  public columns = input.required<readonly KanbanColumn<Item>[]>();

  /** Namespaces the drop-list ids, so two boards on one page stay apart. */
  public group = input('');

  /** The kind of card, which is what colours its indicator. */
  public cardTypeFor = input<(item: Item) => string>(() => '');

  /** What a screen reader reads on a card. */
  public labelFor = input.required<(item: Item) => string>();

  /**
   * Whether the caller keeps an order inside a column. Off, the up and down
   * arrows do nothing and say nothing: this board reports a reorder, it never
   * applies one, so announcing a move the caller drops would be a lie.
   */
  public reorderable = input(false);

  /** Named `kanbanCard` in the caller's content, and handed each item. */
  public readonly cardBody =
    contentChild.required<TemplateRef<{ $implicit: Item }>>('kanbanCard');

  public itemMoved = output<KanbanMove<Item>>();
  public columnReordered = output<KanbanReorder<Item>>();

  /**
   * What the live region reads out. A keyboard move changes nothing the eye
   * can follow from the card that was pressed, since the card is gone from
   * where it was, so the result has to be said.
   */
  public readonly announcement = signal('');

  /**
   * The grid's tracks, one per column, as a custom property the sheet reads.
   *
   * It used to be bound straight to `grid-template-columns`, which put it in
   * an inline style, and an inline style cannot be overridden by the rule
   * that lays this board out one column at a time on a narrow screen.
   */
  public readonly columnTracks = computed(
    () => `repeat(${String(this.columns().length)}, minmax(0, 1fr))`,
  );

  /**
   * Which column a narrow board is showing.
   *
   * Under about 900 px three columns are 110 px each: a card's title breaks
   * one word to a line and the columns' own labels overlap. So one column
   * takes the whole width and a strip of buttons changes which, and the
   * keyboard path that already moves a card between columns becomes the way
   * everyone moves one, rather than a second way nobody could find.
   *
   * The class is set at every width; the rule that acts on it exists only in
   * the narrow container query, so a wide board goes on showing all three.
   */
  public readonly shownColumn = signal(0);

  public showColumn(index: number): void {
    this.shownColumn.set(index);
  }

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

    const moved = from.items[event.previousIndex];

    if (!moved) {
      return;
    }

    this.itemMoved.emit({ item: moved, from: from.id, to: to.id });
  }

  /** The keyboard path across columns, which the CDK does not provide. */
  public moveByKeyboard(
    item: Item,
    column: KanbanColumn<Item>,
    offset: number,
  ): void {
    const columns = this.columns();
    const target =
      columns.findIndex((candidate) => candidate.id === column.id) + offset;
    // Reading past either end hands back nothing, which is the bounds check.
    const destination = columns[target];

    if (!destination) {
      this.announcement.set(
        `Already in the ${offset < 0 ? 'first' : 'last'} column.`,
      );

      return;
    }

    this.itemMoved.emit({ item, from: column.id, to: destination.id });
    this.announcement.set(`Moved to ${destination.label}.`);
    this.refocus(item.id);
  }

  /**
   * The keyboard path inside one column. The drop already reports a reorder
   * when a card lands back in the list it came from; this is the same report,
   * without a mouse.
   */
  public reorderByKeyboard(
    item: Item,
    column: KanbanColumn<Item>,
    offset: number,
  ): void {
    if (!this.reorderable()) {
      return;
    }

    const items = [...column.items];
    const from = items.findIndex((candidate) => candidate.id === item.id);
    const to = from + offset;

    if (from === -1 || to < 0 || to >= items.length) {
      this.announcement.set(
        `Already ${offset < 0 ? 'first' : 'last'} in ${column.label}.`,
      );

      return;
    }

    moveItemInArray(items, from, to);
    this.columnReordered.emit({ columnId: column.id, items });
    this.announcement.set(
      `Moved to position ${String(to + 1)} of ${String(items.length)} in ${column.label}.`,
    );
    this.refocus(item.id);
  }

  /**
   * Puts the focus back on the card that moved, once the caller has redrawn
   * the board. Changing column destroys the card, because the two columns are
   * two `@for` blocks, so without this the focus falls to the document and a
   * second press goes nowhere.
   */
  private refocus(itemId: string): void {
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLElement>(`[data-card-id="${itemId}"]`)
          ?.focus(),
      { injector: this.injector },
    );
  }
}
