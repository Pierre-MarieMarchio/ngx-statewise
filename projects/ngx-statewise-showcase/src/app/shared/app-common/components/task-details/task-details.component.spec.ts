import { TestBed } from '@angular/core/testing';
import { sampleTask } from '@testing/fake-managers';
import { TaskDetailsComponent } from './task-details.component';

describe('TaskDetailsComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskDetailsComponent);
    fixture.componentRef.setInput('selectedTask', sampleTask());
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

  it('reports an overdue due date only while the task is not done', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.isDueDateOverdue('2020-01-01', 'todo')).toBe(true);
    expect(component.isDueDateOverdue('2020-01-01', 'done')).toBe(false);
    expect(component.isDueDateOverdue(undefined, 'todo')).toBe(false);
  });
});
