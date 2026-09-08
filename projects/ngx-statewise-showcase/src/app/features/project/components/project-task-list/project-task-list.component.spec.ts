import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Project } from '@app/features/project/models';
import { Task } from '@shared/app-common/models';
import { AUTH_MANAGER, PROJECT_MANAGER } from '@shared/app-common/tokens';
import {
  fakeAuthManager,
  FakeAuthManager,
  fakeProjectManager,
  sampleUser,
} from '@testing/fake-managers';
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

describe('ProjectTaskListComponent', () => {
  let fixture: ComponentFixture<ProjectTaskListComponent>;
  let authManager: FakeAuthManager;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const headers = (): string[] =>
    Array.from(host().querySelectorAll<HTMLElement>('th[mat-header-cell]')).map(
      (cell) => cell.textContent?.trim() ?? '',
    );

  beforeEach(async () => {
    authManager = fakeAuthManager(sampleUser({ role: 'admin' }));

    await TestBed.configureTestingModule({
      imports: [ProjectTaskListComponent],
      providers: [
        { provide: PROJECT_MANAGER, useValue: fakeProjectManager(PROJECTS) },
        { provide: AUTH_MANAGER, useValue: authManager },
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

    expect(component.getFilteredTasks('p-1').map((task) => task.id)).toEqual([
      't-1',
    ]);
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
