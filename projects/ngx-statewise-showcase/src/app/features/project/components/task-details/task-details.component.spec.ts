import { TestBed } from '@angular/core/testing';
import { TEAM_DIRECTORY } from '@app/features/project/ports';
import { ProjectManager } from '@app/features/project/states/project/project.manager';
import {
  fakeProjectManager,
  fakeTeamDirectory,
  sampleProject,
  sampleTask,
} from '@testing/fake-managers';
import { TaskDetailsComponent } from './task-details.component';

describe('TaskDetailsComponent', () => {
  const mount = async (task = sampleTask()) => {
    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent],
      providers: [
        { provide: TEAM_DIRECTORY, useValue: fakeTeamDirectory() },
        { provide: ProjectManager, useValue: fakeProjectManager() },
      ],
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
   * The same two marks the tables draw, from the same components — they were
   * `mat-chip`s here and grey lowercase words there, one idea rendered twice.
   * Each carries the tint of its own scale: cold for a status, warm for a
   * priority, so neither can be read as the other.
   */
  it('draws the status and the priority as the tables do', async () => {
    const fixture = await mount(
      sampleTask({ status: 'todo', priority: 'high' }),
    );
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('app-status-badge')).not.toBeNull();
    expect(host.querySelector('app-priority-badge')).not.toBeNull();

    const tints = Array.from(host.querySelectorAll<HTMLElement>('.chip')).map(
      (chip) => chip.style.backgroundColor,
    );

    expect(tints[0]).toContain('--status-todo');
    expect(tints[1]).toContain('--priority-high');
  });

  /**
   * A button that emits into nothing is worse than no button: the dashboard's
   * panel reads, and only the board's offers the edit.
   */
  describe('offering the edit', () => {
    it('says nothing about editing unless the caller asked', async () => {
      const fixture = await mount();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.edit-btn'),
      ).toBeNull();
    });

    it('says nothing about removing one either', async () => {
      const fixture = await mount();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.delete-btn'),
      ).toBeNull();
    });

    it('asks its caller to remove the task, rather than removing it', async () => {
      const fixture = await mount();
      fixture.componentRef.setInput('editable', true);
      fixture.detectChanges();

      const asked: string[] = [];
      fixture.componentInstance.deleteRequested.subscribe(() =>
        asked.push('delete'),
      );

      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLButtonElement>('.delete-btn')
        ?.click();

      expect(asked).toEqual(['delete']);
    });

    it('asks its caller for the edit it cannot do itself', async () => {
      const fixture = await mount();
      fixture.componentRef.setInput('editable', true);
      fixture.detectChanges();

      const asked: string[] = [];
      fixture.componentInstance.editRequested.subscribe(() =>
        asked.push('edit'),
      );

      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLButtonElement>('.edit-btn')
        ?.click();

      expect(asked).toEqual(['edit']);
    });
  });

  /**
   * The two fields that used to print a UUID at the reader. Both fall back to
   * the id, which is the honest answer while a directory is still on its way.
   */
  describe('what it makes of an id', () => {
    it('names the assignees rather than listing their ids', async () => {
      const fixture = await mount();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('admin');
      expect(text).not.toContain('user-1');
    });

    it('falls back to the id nobody answers to', async () => {
      const fixture = await mount(sampleTask({ assignedUserIds: ['user-9'] }));

      expect(
        (fixture.nativeElement as HTMLElement).textContent ?? '',
      ).toContain('user-9');
    });

    /*
     * The project's name sits behind the second tab, and Material attaches an
     * inactive tab body only once its tab is activated — so there is no DOM
     * here to read it off, and the derivation is what this asserts.
     */
    it('names the project, and falls back to its id', async () => {
      const fixture = await mount();

      expect(fixture.componentInstance.projectName()).toBe(
        sampleProject().title,
      );

      fixture.componentRef.setInput(
        'selectedTask',
        sampleTask({ projectId: 'project-9' }),
      );

      expect(fixture.componentInstance.projectName()).toBe('project-9');
    });
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
