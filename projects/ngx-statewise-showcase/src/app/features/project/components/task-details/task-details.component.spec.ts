import { TestBed } from '@angular/core/testing';
import { sampleTask } from '@testing/fake-managers';
import { TaskDetailsComponent } from './task-details.component';

describe('TaskDetailsComponent', () => {
  const mount = async (task = sampleTask()) => {
    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskDetailsComponent);
    fixture.componentRef.setInput('selectedTask', task);
    fixture.detectChanges();
    return fixture;
  };

  it('renders the title of the selected task', async () => {
    const fixture = await mount();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      sampleTask().title,
    );
  });

  /** Reached from the template, unlike the two outputs that used to sit here. */
  it('reports the close the panel asked for', async () => {
    const fixture = await mount();
    const closed: string[] = [];
    fixture.componentInstance.closed.subscribe(() => closed.push('closed'));

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.close-btn')
      ?.click();

    expect(closed).toEqual(['closed']);
  });

  /**
   * Whether a date is late is the presentation service's rule, and its own spec
   * covers it. What belongs here is that the panel shows it: the warning marks
   * an overdue task and stays away once it is done.
   */
  it('marks an overdue due date, and stops once the task is done', async () => {
    const fixture = await mount(sampleTask({ dueDate: '2020-01-01' }));
    const host = () => fixture.nativeElement as HTMLElement;

    expect(host().querySelector('.warning-icon')).not.toBeNull();
    expect(host().querySelector('.due-date-content.overdue')).not.toBeNull();

    fixture.componentRef.setInput(
      'selectedTask',
      sampleTask({ dueDate: '2020-01-01', status: 'done' }),
    );
    fixture.detectChanges();

    expect(host().querySelector('.warning-icon')).toBeNull();
    expect(host().querySelector('.due-date-content.overdue')).toBeNull();
  });
});
