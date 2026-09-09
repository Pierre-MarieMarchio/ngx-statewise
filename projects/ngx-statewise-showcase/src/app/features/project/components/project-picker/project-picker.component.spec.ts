import { TestBed } from '@angular/core/testing';
import { ProjectManager } from '@app/features/project/states/project/project.manager';
import {
  fakeProjectManager,
  FakeProjectManager,
  sampleProject,
  sampleTask,
} from '@testing/fake-managers';
import { ProjectPickerComponent } from './project-picker.component';

const PROJECTS = [
  sampleProject({ id: 'p-1', title: 'Analytics' }),
  sampleProject({ id: 'p-2', title: 'Billing' }),
];

const TASKS = [
  sampleTask({ id: 't-1', projectId: 'p-1', status: 'todo' }),
  sampleTask({ id: 't-2', projectId: 'p-1', status: 'done' }),
  sampleTask({ id: 't-3', projectId: 'p-2', status: 'todo' }),
];

describe('ProjectPickerComponent', () => {
  let projectManager: FakeProjectManager;

  const mount = async (projects = PROJECTS) => {
    projectManager = fakeProjectManager(projects);

    await TestBed.configureTestingModule({
      imports: [ProjectPickerComponent],
      providers: [{ provide: ProjectManager, useValue: projectManager }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProjectPickerComponent);
    fixture.componentRef.setInput('tasks', TASKS);
    fixture.detectChanges();
    return fixture;
  };

  const rows = (fixture: { nativeElement: unknown }) =>
    Array.from(
      (
        fixture.nativeElement as HTMLElement
      ).querySelectorAll<HTMLButtonElement>('.project-picker-row'),
    );

  it('offers every project, and the way back to all of them', async () => {
    const fixture = await mount();

    expect(
      rows(fixture).map((row) =>
        row.querySelector('.project-picker-name')?.textContent?.trim(),
      ),
    ).toEqual(['All projects', 'Analytics', 'Billing']);
  });

  it('counts what is in each project, and in all of them', async () => {
    const fixture = await mount();
    const counts = rows(fixture).map((row) =>
      row
        .querySelector('.project-picker-counts')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim(),
    );

    expect(counts[0]).toBe('3 tasks');
    expect(counts[1]).toBe('2 tasks — 1 to do, 0 in progress, 1 done');
    // Not "1 tasks": the count is read as often as the name beside it.
    expect(counts[2]).toBe('1 task — 1 to do, 0 in progress, 0 done');
  });

  it('chooses the project whose row was pressed, and says it did', async () => {
    const fixture = await mount();
    const chosen: string[] = [];
    fixture.componentInstance.chosen.subscribe(() => chosen.push('chosen'));

    rows(fixture)[1]?.click();

    expect(projectManager.selectedProjectId()).toBe('p-1');
    expect(chosen).toEqual(['chosen']);
  });

  /** Unchoosing is choosing, so it is a row like the others. */
  it('goes back to all of them from the first row', async () => {
    const fixture = await mount();
    projectManager.selectProject('p-1');

    rows(fixture)[0]?.click();

    expect(projectManager.selectedProjectId()).toBeNull();
  });

  it('marks the row that is current, for a reader and for a screen reader', async () => {
    const fixture = await mount();
    projectManager.selectProject('p-2');
    fixture.detectChanges();

    const current = rows(fixture).filter(
      (row) => row.getAttribute('aria-current') === 'true',
    );

    expect(current).toHaveLength(1);
    expect(
      current[0]?.querySelector('.project-picker-name')?.textContent?.trim(),
    ).toBe('Billing');
    expect(current[0]?.classList.contains('is-current')).toBe(true);
  });

  it('says what to do when there is no project at all', async () => {
    const fixture = await mount([]);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No project yet.',
    );
    expect(rows(fixture)).toEqual([]);
  });
});
