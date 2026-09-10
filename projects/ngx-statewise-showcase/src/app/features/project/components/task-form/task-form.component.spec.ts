import { TestBed } from '@angular/core/testing';
import { TEAM_DIRECTORY } from '@app/features/project/ports';
import type {
  Task,
  TaskPriority,
  TaskStatus,
} from '@app/features/project/models';
import {
  fakeTeamDirectory,
  sampleProject,
  sampleTask,
} from '@testing/fake-managers';
import { TaskFormComponent } from './task-form.component';

const PROJECTS = [
  sampleProject({ id: 'p-1', title: 'Analytics' }),
  sampleProject({ id: 'p-2', title: 'Billing' }),
];

/** A function, so no two tests share one array to fill in. */
const filledIn = () => ({
  projectId: 'p-2',
  title: 'Wire the form',
  description: 'A description',
  status: 'in-progress' as TaskStatus,
  priority: 'high' as TaskPriority,
  dueDate: '2026-03-01',
  assignedUserIds: ['user-2'],
});

describe('TaskFormComponent', () => {
  const mount = async (task: Task | null = null) => {
    await TestBed.configureTestingModule({
      imports: [TaskFormComponent],
      providers: [{ provide: TEAM_DIRECTORY, useValue: fakeTeamDirectory() }],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskFormComponent);
    fixture.componentRef.setInput('projects', PROJECTS);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
    return fixture;
  };

  const host = (fixture: { nativeElement: unknown }) =>
    fixture.nativeElement as HTMLElement;

  const drafting = (fixture: {
    componentInstance: TaskFormComponent;
  }): Record<string, unknown>[] => {
    const drafts: Record<string, unknown>[] = [];
    fixture.componentInstance.submitted.subscribe((draft) =>
      drafts.push(draft as unknown as Record<string, unknown>),
    );

    return drafts;
  };

  it('refuses an empty form and says which fields it wants', async () => {
    const fixture = await mount();
    const drafts = drafting(fixture);

    fixture.componentInstance.handleSubmit();
    fixture.detectChanges();

    expect(drafts).toEqual([]);
    expect(
      Array.from(host(fixture).querySelectorAll('mat-error')).map((error) =>
        error.textContent?.trim(),
      ),
    ).toEqual(['A project is required.', 'A title is required.']);
  });

  it('hands over the draft it was filled with', async () => {
    const fixture = await mount();
    const drafts = drafting(fixture);

    fixture.componentInstance.form.setValue(filledIn());
    fixture.componentInstance.handleSubmit();

    expect(drafts).toEqual([filledIn()]);
  });

  it('offers the organisation as the people to assign', async () => {
    const fixture = await mount();

    expect(fixture.componentInstance.directory.members().length).toBe(2);
  });

  it('repeats the server’s refusal as it came', async () => {
    const fixture = await mount();
    fixture.componentRef.setInput(
      'refusal',
      'this project already has a task called "x"',
    );
    fixture.detectChanges();

    expect(
      host(fixture).querySelector('[role="alert"]')?.textContent,
    ).toContain('already has a task called');
  });

  describe('writing a new task', () => {
    it('says so, in the heading and on the button', async () => {
      const fixture = await mount();

      expect(
        host(fixture).querySelector('.panel-form-title')?.textContent?.trim(),
      ).toBe('New task');
      expect(
        host(fixture)
          .querySelector('button[type="submit"]')
          ?.textContent?.trim(),
      ).toBe('Create task');
    });

    /** An empty optional field is no field, not a blank one. */
    it('leaves an empty description and an empty date out', async () => {
      const fixture = await mount();
      const drafts = drafting(fixture);

      fixture.componentInstance.form.setValue({
        ...filledIn(),
        description: '   ',
        dueDate: '',
      });
      fixture.componentInstance.handleSubmit();

      expect(drafts[0]?.['description']).toBeUndefined();
      expect(drafts[0]?.['dueDate']).toBeUndefined();
    });
  });

  describe('changing one that exists', () => {
    it('says so, and opens on the task it was given', async () => {
      const fixture = await mount(sampleTask());

      expect(
        host(fixture).querySelector('.panel-form-title')?.textContent?.trim(),
      ).toBe('Edit task');
      expect(fixture.componentInstance.form.getRawValue()).toEqual({
        projectId: 'project-1',
        title: sampleTask().title,
        description: sampleTask().description,
        status: 'todo',
        priority: 'high',
        dueDate: '2026-12-01',
        assignedUserIds: ['user-1'],
      });
    });

    /** A stored date may carry a time; a date field speaks ten characters. */
    it('takes the day out of a date that carries a time', async () => {
      const fixture = await mount(
        sampleTask({ dueDate: '2026-12-01T09:30:00.000Z' }),
      );

      expect(fixture.componentInstance.form.getRawValue().dueDate).toBe(
        '2026-12-01',
      );
    });

    /**
     * The one thing an edit could not otherwise do: an update merges what it
     * is handed, so a field left out is a field left alone.
     */
    it('sends an emptied field as empty rather than leaving it out', async () => {
      const fixture = await mount(sampleTask());
      const drafts = drafting(fixture);

      fixture.componentInstance.form.patchValue({
        description: '',
        dueDate: '',
      });
      fixture.componentInstance.handleSubmit();

      expect(drafts[0]?.['description']).toBe('');
      expect(drafts[0]?.['dueDate']).toBe('');
    });
  });
});
