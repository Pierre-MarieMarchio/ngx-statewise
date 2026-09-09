import { TestBed } from '@angular/core/testing';
import { KanbanCardComponent } from './kanban-card.component';

describe('KanbanCardComponent', () => {
  it('renders a card whose indicator follows the card type', async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(KanbanCardComponent);
    fixture.componentRef.setInput('cardType', 'high');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('mat-card')).not.toBeNull();
    expect(host.querySelector('.card-type-indicator')?.classList).toContain(
      'indicator-high',
    );
  });

  /**
   * The board puts the drag on this host, so the card must not bring one of
   * its own — two `cdkDrag` in one card is how the placeholder ended up inside
   * the element that was supposed to move.
   */
  it('carries no drag of its own', async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(KanbanCardComponent);
    fixture.componentRef.setInput('cardType', 'low');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[cdkdrag]'),
    ).toBeNull();
  });
});
