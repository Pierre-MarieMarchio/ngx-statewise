import { TestBed } from '@angular/core/testing';
import { sampleProject } from '@testing/fake-managers';
import { ProjectFormComponent } from './project-form.component';

describe('ProjectFormComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFormComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProjectFormComponent);
    fixture.detectChanges();
    return fixture;
  };

  const host = (fixture: { nativeElement: unknown }) =>
    fixture.nativeElement as HTMLElement;

  it('offers exactly the colours the stylesheet knows', async () => {
    const fixture = await mount();

    expect([...fixture.componentInstance.colors]).toEqual([
      'orange',
      'green',
      'blue',
      'purple',
      'pink',
    ]);
  });

  /**
   * Material renders an error only once a control has been touched, so an
   * untouched form used to submit and show nothing at all.
   */
  it('refuses an empty title and says so instead of submitting', async () => {
    const fixture = await mount();
    const drafts: unknown[] = [];
    fixture.componentInstance.submitted.subscribe((draft) =>
      drafts.push(draft),
    );

    fixture.componentInstance.handleSubmit();
    fixture.detectChanges();

    expect(drafts).toEqual([]);
    expect(host(fixture).querySelector('mat-error')?.textContent).toContain(
      'A title is required',
    );
  });

  it('hands over the draft it was filled with', async () => {
    const fixture = await mount();
    const drafts: unknown[] = [];
    fixture.componentInstance.submitted.subscribe((draft) =>
      drafts.push(draft),
    );

    fixture.componentInstance.form.setValue({
      title: 'Analytics',
      color: 'pink',
    });
    fixture.componentInstance.handleSubmit();

    expect(drafts).toEqual([{ title: 'Analytics', color: 'pink' }]);
  });

  it('repeats the server’s refusal as it came', async () => {
    const fixture = await mount();
    fixture.componentRef.setInput(
      'refusal',
      'a project is already called "Analytics"',
    );
    fixture.detectChanges();

    const refusal = host(fixture).querySelector('[role="alert"]');

    expect(refusal?.textContent).toContain('already called "Analytics"');
  });

  it('holds a second submit while one is on its way', async () => {
    const fixture = await mount();
    fixture.componentRef.setInput('pending', true);
    fixture.detectChanges();

    const submit = host(fixture).querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );

    expect(submit?.disabled).toBe(true);
    expect(submit?.textContent).toContain('Creating');
  });

  describe('renaming one that exists', () => {
    const mountEditing = async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectFormComponent],
      }).compileComponents();

      const fixture = TestBed.createComponent(ProjectFormComponent);
      fixture.componentRef.setInput(
        'project',
        sampleProject({ id: 'p-1', title: 'Analytics', color: 'green' }),
      );
      fixture.detectChanges();

      return fixture;
    };

    it('says so, and opens on the project it was given', async () => {
      const fixture = await mountEditing();
      const host = fixture.nativeElement as HTMLElement;

      expect(host.querySelector('.panel-form-title')?.textContent?.trim()).toBe(
        'Edit project',
      );
      expect(
        host.querySelector('button[type="submit"]')?.textContent?.trim(),
      ).toBe('Save changes');
      expect(fixture.componentInstance.form.getRawValue()).toEqual({
        title: 'Analytics',
        color: 'green',
      });
    });

    it('hands over what it was changed to', async () => {
      const fixture = await mountEditing();
      const drafts: unknown[] = [];
      fixture.componentInstance.submitted.subscribe((draft) =>
        drafts.push(draft),
      );

      fixture.componentInstance.form.setValue({
        title: 'Renamed',
        color: 'pink',
      });
      fixture.componentInstance.handleSubmit();

      expect(drafts).toEqual([{ title: 'Renamed', color: 'pink' }]);
    });
  });
});
