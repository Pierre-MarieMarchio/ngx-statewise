import { TestBed } from '@angular/core/testing';
import { sampleProject } from '@testing/fake-managers';
import { TaskFormComponent } from './task-form.component';

const PROJECTS = [
  sampleProject({ id: 'p-1', title: 'Analytics' }),
  sampleProject({ id: 'p-2', title: 'Billing' }),
];

describe('TaskFormComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [TaskFormComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskFormComponent);
    fixture.componentRef.setInput('projects', PROJECTS);
    fixture.detectChanges();
    return fixture;
  };

  const host = (fixture: { nativeElement: unknown }) =>
    fixture.nativeElement as HTMLElement;

  it('refuses an empty form and says which fields it wants', async () => {
    const fixture = await mount();
    const drafts: unknown[] = [];
    fixture.componentInstance.submitted.subscribe((draft) =>
      drafts.push(draft),
    );

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
    const drafts: unknown[] = [];
    fixture.componentInstance.submitted.subscribe((draft) =>
      drafts.push(draft),
    );

    fixture.componentInstance.form.setValue({
      projectId: 'p-2',
      title: 'Wire the form',
      description: 'A description',
      status: 'in-progress',
      priority: 'high',
    });
    fixture.componentInstance.handleSubmit();

    expect(drafts).toEqual([
      {
        projectId: 'p-2',
        title: 'Wire the form',
        description: 'A description',
        status: 'in-progress',
        priority: 'high',
      },
    ]);
  });

  /** An empty description is no description, not a blank one. */
  it('leaves the description out when it was not filled', async () => {
    const fixture = await mount();
    const drafts: Record<string, unknown>[] = [];
    fixture.componentInstance.submitted.subscribe((draft) =>
      drafts.push(draft as unknown as Record<string, unknown>),
    );

    fixture.componentInstance.form.setValue({
      projectId: 'p-1',
      title: 'No description',
      description: '   ',
      status: 'todo',
      priority: 'low',
    });
    fixture.componentInstance.handleSubmit();

    expect(drafts[0] && 'description' in drafts[0]).toBe(false);
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
});
