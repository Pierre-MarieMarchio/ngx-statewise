import { TestBed } from '@angular/core/testing';
import { TEAM_DIRECTORY } from '@app/features/project/ports';
import { TaskManager } from '@app/features/project/states/task/task.manager';
import {
  fakeTaskManager,
  FakeTaskManager,
  fakeTeamDirectory,
  sampleTask,
} from '@testing/fake-managers';
import { Task } from '../../models';
import { TaskCardBodyComponent } from './task-card-body.component';

describe('TaskCardBodyComponent', () => {
  let taskManager: FakeTaskManager;

  const mount = async (task: Task = sampleTask()) => {
    taskManager = fakeTaskManager([task]);

    await TestBed.configureTestingModule({
      imports: [TaskCardBodyComponent],
      providers: [
        { provide: TEAM_DIRECTORY, useValue: fakeTeamDirectory() },
        { provide: TaskManager, useValue: taskManager },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskCardBodyComponent);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
    return fixture;
  };

  const host = (fixture: { nativeElement: unknown }) =>
    fixture.nativeElement as HTMLElement;

  it('shows the title and the description of the task it was given', async () => {
    const fixture = await mount(
      sampleTask({ title: 'Wire the board', description: 'Both callers.' }),
    );

    expect(
      host(fixture).querySelector('mat-card-title')?.textContent?.trim(),
    ).toBe('Wire the board');
    expect(
      host(fixture).querySelector('mat-card-content p')?.textContent?.trim(),
    ).toBe('Both callers.');
  });

  /**
   * What the card said about urgency used to be a 4 px stripe down its side,
   * with no legend anywhere on the page. It says it in words now, beside the
   * two other things anyone looking at a board wants: when, and whose.
   */
  it('says what is urgent, when it is due and whose it is', async () => {
    const fixture = await mount();
    const meta =
      host(fixture)
        .querySelector('.card-meta')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim() ?? '';

    expect(meta).toContain('High');
    expect(meta).toContain('December 1, 2026');
    expect(meta).toContain('admin');
  });

  it('marks a date already past', async () => {
    const fixture = await mount(sampleTask({ dueDate: '2020-01-01' }));

    expect(host(fixture).querySelector('.card-due.is-overdue')).not.toBeNull();
  });

  /** A task already done is never late, whatever its date says. */
  it('stops marking it once the task is done', async () => {
    const fixture = await mount(
      sampleTask({ dueDate: '2020-01-01', status: 'done' }),
    );

    expect(host(fixture).querySelector('.card-due.is-overdue')).toBeNull();
  });

  /**
   * The library's voice, on the one card it is about: this row is showing a
   * version the server has not answered for, and `pendingWrites` is holding
   * the one it replaced in case it never does.
   */
  it('marks its own write while it is still out', async () => {
    const fixture = await mount();

    expect(host(fixture).querySelector('.card-saving')).toBeNull();

    taskManager.writing.set(new Set(['task-1']));
    fixture.detectChanges();

    expect(host(fixture).querySelector('.card-saving')).not.toBeNull();
    expect(host(fixture).textContent).toContain('Saving');
  });

  it('says nothing about a write of some other card', async () => {
    const fixture = await mount();

    taskManager.writing.set(new Set(['task-2']));
    fixture.detectChanges();

    expect(host(fixture).querySelector('.card-saving')).toBeNull();
  });
});
