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

  it('emits closed, modify and delete for the selected task', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    const closed: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];
    component.closed.subscribe(() => closed.push('closed'));
    component.modify.subscribe((task) => modified.push(task.id));
    component.delete.subscribe((id) => deleted.push(id));

    component.onCloseClick();
    component.onModifyClick();
    component.onDeleteClick();

    expect(closed).toEqual(['closed']);
    expect(modified).toEqual(['task-1']);
    expect(deleted).toEqual(['task-1']);
  });

  it('reports an overdue due date only while the task is not done', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.isDueDateOverdue('2020-01-01', 'todo')).toBeTrue();
    expect(component.isDueDateOverdue('2020-01-01', 'done')).toBeFalse();
    expect(component.isDueDateOverdue(undefined, 'todo')).toBeFalse();
  });
});
