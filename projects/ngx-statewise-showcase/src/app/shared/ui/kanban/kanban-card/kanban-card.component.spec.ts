import { TestBed } from '@angular/core/testing';
import { sampleTask } from '@testing/fake-managers';
import { KanbanCardComponent } from './kanban-card.component';

describe('KanbanCardComponent', () => {
  it('renders a card whose indicator follows the card type', async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(KanbanCardComponent);
    fixture.componentRef.setInput('data', sampleTask());
    fixture.componentRef.setInput('cardType', 'high');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('mat-card')).not.toBeNull();
    expect(host.querySelector('.card-type-indicator')?.classList).toContain(
      'indicator-high',
    );
  });
});
