import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Project } from '@app/features/project/models';
import { Task } from '../../models';
import {
  fakeAuthSession,
  FakeAuthSession,
  fakeProjectManager,
  sampleUser,
} from '@testing/fake-managers';
import { ProjectTaskListComponent } from './project-task-list.component';
import { AUTH_SESSION } from '@app/features/common';
import { ProjectManager } from '@app/features/project/states/project/project.manager';

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

describe('ProjectTaskListComponent', () => {
  let fixture: ComponentFixture<ProjectTaskListComponent>;
  let authManager: FakeAuthSession;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const headers = (): string[] =>
    Array.from(host().querySelectorAll<HTMLElement>('th[mat-header-cell]')).map(
      (cell) => cell.textContent?.trim() ?? '',
    );

  beforeEach(async () => {
    authManager = fakeAuthSession(sampleUser({ role: 'admin' }));

    await TestBed.configureTestingModule({
      imports: [ProjectTaskListComponent],
      providers: [
        { provide: ProjectManager, useValue: fakeProjectManager(PROJECTS) },
        { provide: AUTH_SESSION, useValue: authManager },
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
    const component = fixture.componentInstance;

    expect(
      component
        .groups()
        .find((group) => group.project.id === 'p-1')
        ?.tasks.map((task) => task.id),
    ).toEqual(['t-1']);
  });

  it('shows the organisation column to an admin', () => {
    expect(headers()).toEqual(['Title', 'Status', 'Priority', 'Organisation']);
  });

  it('hides the organisation column from a contributor', () => {
    authManager.user.set(sampleUser({ role: 'contributor' }));
    fixture.detectChanges();

    expect(headers()).toEqual(['Title', 'Status', 'Priority']);
  });

  it('hides the organisation column while no user is known', () => {
    authManager.user.set(null);
    fixture.detectChanges();

    expect(headers()).toEqual(['Title', 'Status', 'Priority']);
  });
});
