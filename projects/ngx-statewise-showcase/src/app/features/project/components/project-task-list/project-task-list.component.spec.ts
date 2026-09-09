import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AUTH_SESSION } from '@app/features/common';
import { Project } from '@app/features/project/models';
import { ProjectManager } from '@app/features/project/states/project/project.manager';
import {
  fakeAuthSession,
  fakeProjectManager,
  sampleUser,
} from '@testing/fake-managers';
import { openFirstRow } from '@testing/task-table';
import { Task } from '../../models';
import { ProjectTaskListComponent } from './project-task-list.component';

const PROJECTS: Project[] = [
  { id: 'p-1', title: 'Analytics Dashboard', color: 'orange' },
];

const TASKS: Task[] = [
  {
    id: 't-1',
    projectId: 'p-1',
    organizationId: 'org-1',
    title: 'Wire the columns to the role',
    status: 'todo',
    priority: 'high',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 't-2',
    projectId: 'p-other',
    organizationId: 'org-1',
    title: 'Belongs to another project',
    status: 'done',
    priority: 'low',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

/**
 * What this view decides is the grouping, and that a table inside an accordion
 * asks for capped columns. Which columns a role may see is asserted once in
 * `app-task-table`'s own spec.
 */
describe('ProjectTaskListComponent', () => {
  let fixture: ComponentFixture<ProjectTaskListComponent>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskListComponent],
      providers: [
        { provide: ProjectManager, useValue: fakeProjectManager(PROJECTS) },
        {
          provide: AUTH_SESSION,
          useValue: fakeAuthSession(sampleUser({ role: 'admin' })),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectTaskListComponent);
    fixture.componentRef.setInput('tasks', TASKS);
    fixture.detectChanges();
  });

  it('renders one panel per project', () => {
    expect(host().querySelectorAll('mat-expansion-panel').length).toBe(
      PROJECTS.length,
    );
  });

  it('keeps only the tasks of the project it lists', () => {
    expect(
      fixture.componentInstance
        .groups()
        .find((group) => group.project.id === 'p-1')
        ?.tasks.map((task) => task.id),
    ).toEqual(['t-1']);
  });

  /** A table in an accordion cannot spread, so it asks for capped columns. */
  it('caps the columns of the table it mounts', () => {
    const capped = Array.from(
      host().querySelectorAll<HTMLElement>('th[mat-header-cell]'),
    ).map((cell) => cell.style.width || null);

    expect(capped).toEqual([null, '200px', '200px', '200px', null]);
  });

  it('opens a task from a named button, once', () => {
    expect(openFirstRow(fixture)).toEqual({
      name: 'Open Wire the columns to the role',
      emitted: ['t-1'],
    });
  });
});
