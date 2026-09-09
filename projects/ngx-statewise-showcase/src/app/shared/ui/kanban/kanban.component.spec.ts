import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KanbanComponent } from './kanban.component';
import type {
  KanbanColumn,
  KanbanMove,
  KanbanReorder,
} from './kanban-column.model';

interface Card {
  readonly id: string;
  readonly title: string;
}

const card = (id: string): Card => ({ id, title: `Card ${id}` });

const COLUMNS: KanbanColumn<Card>[] = [
  { id: 'left', label: 'Left', items: [card('a'), card('b')] },
  { id: 'middle', label: 'Middle', items: [card('c')] },
  { id: 'right', label: 'Right', items: [] },
];

@Component({
  imports: [KanbanComponent],
  template: `
    <app-kanban
      [columns]="columns()"
      [group]="group()"
      [labelFor]="labelFor"
      (itemMoved)="moves.push($event)"
      (columnReordered)="reorders.push($event)"
    >
      <ng-template #kanbanCard let-item>
        <span class="card-title">{{ item.title }}</span>
      </ng-template>
    </app-kanban>
  `,
})
class HostComponent {
  public readonly columns = signal(COLUMNS);
  public readonly group = signal('');
  public readonly moves: KanbanMove<Card>[] = [];
  public readonly reorders: KanbanReorder<Card>[] = [];

  public readonly labelFor = (item: Card): string => `${item.title}, movable`;
}

/** A drop the CDK would build, with only what the component reads. */
const dropOf = (
  from: KanbanColumn<Card>,
  to: KanbanColumn<Card>,
  previousIndex: number,
  currentIndex: number,
): CdkDragDrop<KanbanColumn<Card>> =>
  ({
    previousContainer: { data: from },
    container: { data: to },
    previousIndex,
    currentIndex,
  }) as unknown as CdkDragDrop<KanbanColumn<Card>>;

describe('KanbanComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    return fixture;
  };

  const board = (fixture: { debugElement: { children: unknown[] } }) =>
    (
      fixture as unknown as {
        debugElement: {
          children: { componentInstance: KanbanComponent<Card> }[];
        };
      }
    ).debugElement.children[0].componentInstance;

  it('renders one named list per column', async () => {
    const fixture = await mount();

    expect(
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll(
          '[role="list"]',
        ),
      ).map((column) => column.getAttribute('aria-label')),
    ).toEqual(['Left items', 'Middle items', 'Right items']);
  });

  it('renders each item through the card body it was given', async () => {
    const fixture = await mount();

    expect(
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('.card-title'),
      ).map((title) => title.textContent),
    ).toEqual(['Card a', 'Card b', 'Card c']);
  });

  it('makes every card a named tab stop', async () => {
    const fixture = await mount();
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'app-kanban-card',
    );

    expect(cards.length).toBe(3);
    for (const rendered of Array.from(cards)) {
      expect(rendered.getAttribute('tabindex')).toBe('0');
      expect(rendered.getAttribute('aria-label')).toContain('movable');
    }
  });

  describe('drop-list ids', () => {
    it('names each list, and connects them to each other', async () => {
      const fixture = await mount();

      expect(board(fixture).dropListIds()).toEqual([
        'kanban_left',
        'kanban_middle',
        'kanban_right',
      ]);
    });

    /** Two boards on one page must not connect their lists together. */
    it('namespaces them by group when there is one', async () => {
      const fixture = await mount();
      fixture.componentInstance.group.set('project-1');
      fixture.detectChanges();

      expect(board(fixture).dropListIds()).toEqual([
        'kanban_project-1_left',
        'kanban_project-1_middle',
        'kanban_project-1_right',
      ]);
    });
  });

  describe('moving a card', () => {
    it('reports a drop into another column, source and target', async () => {
      const fixture = await mount();

      board(fixture).onDrop(dropOf(COLUMNS[0], COLUMNS[2], 1, 0));

      expect(fixture.componentInstance.moves).toEqual([
        { item: card('b'), from: 'left', to: 'right' },
      ]);
    });

    it('reports a reorder inside one column, in its new order', async () => {
      const fixture = await mount();

      board(fixture).onDrop(dropOf(COLUMNS[0], COLUMNS[0], 0, 1));

      expect(fixture.componentInstance.reorders).toEqual([
        { columnId: 'left', items: [card('b'), card('a')] },
      ]);
      expect(fixture.componentInstance.moves).toEqual([]);
    });

    /**
     * It holds no state on purpose: the caller's state decides, which is what
     * lets an optimistic update render the move.
     */
    it('leaves the columns it was given untouched', async () => {
      const fixture = await mount();

      board(fixture).onDrop(dropOf(COLUMNS[0], COLUMNS[2], 0, 0));

      expect(COLUMNS[0].items.map((item) => item.id)).toEqual(['a', 'b']);
      expect(COLUMNS[2].items).toEqual([]);
    });
  });

  describe('the keyboard path', () => {
    it('moves a card to the next column', async () => {
      const fixture = await mount();

      board(fixture).moveByKeyboard(card('a'), COLUMNS[0], 1);

      expect(fixture.componentInstance.moves).toEqual([
        { item: card('a'), from: 'left', to: 'middle' },
      ]);
    });

    it('moves it to the previous one', async () => {
      const fixture = await mount();

      board(fixture).moveByKeyboard(card('c'), COLUMNS[1], -1);

      expect(fixture.componentInstance.moves).toEqual([
        { item: card('c'), from: 'middle', to: 'left' },
      ]);
    });

    it('stops at the ends rather than wrapping around', async () => {
      const fixture = await mount();

      board(fixture).moveByKeyboard(card('a'), COLUMNS[0], -1);
      board(fixture).moveByKeyboard(card('c'), COLUMNS[2], 1);

      expect(fixture.componentInstance.moves).toEqual([]);
    });
  });
});
