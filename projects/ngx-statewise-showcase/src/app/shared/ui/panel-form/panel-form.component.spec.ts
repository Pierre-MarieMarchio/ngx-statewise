import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PanelFormComponent } from './panel-form.component';

/**
 * Signals rather than plain properties: the application is zoneless, so
 * mutating a field marks nothing dirty and an OnPush child never sees the new
 * value. `zoneless-plain-properties.spec.ts` is about that very difference.
 */
@Component({
  imports: [PanelFormComponent, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submits.set(submits() + 1)">
      <app-panel-form
        heading="New project"
        submitLabel="Create project"
        pendingLabel="Creating…"
        [pending]="pending()"
        [refusal]="refusal()"
        (cancelled)="cancels.set(cancels() + 1)"
      >
        <input class="a-field" formControlName="title" />
      </app-panel-form>
    </form>
  `,
})
class HostComponent {
  public readonly form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true }),
  });

  public readonly pending = signal(false);
  public readonly refusal = signal<string | null>(null);
  public readonly submits = signal(0);
  public readonly cancels = signal(0);
}

describe('PanelFormComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  };

  const button = (fixture: { nativeElement: unknown }, label: string) =>
    Array.from(
      (
        fixture.nativeElement as HTMLElement
      ).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.trim() === label);

  it('shows the heading and projects the fields', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.panel-form-title')?.textContent?.trim()).toBe(
      'New project',
    );
    expect(host.querySelector('.a-field')).not.toBeNull();
  });

  it('says nothing about a refusal until there is one', async () => {
    const fixture = await mount();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]'),
    ).toBeNull();

    fixture.componentInstance.refusal.set('a project is already called that');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('[role="alert"]')
        ?.textContent?.trim(),
    ).toBe('a project is already called that');
  });

  /**
   * The shell does not own the `<form>`, and this is why: a projected field
   * resolves its `formControlName` against the group declared in the caller's
   * own template, not in the shell's. The shell's submit button only has to be
   * a descendant of that form.
   */
  it("projects a field into the caller's own form group", async () => {
    const fixture = await mount();
    const field = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLInputElement>('.a-field');

    if (field) {
      field.value = 'Analytics v2';
      field.dispatchEvent(new Event('input'));
    }

    expect(fixture.componentInstance.form.controls.title.value).toBe(
      'Analytics v2',
    );
  });

  it('submits the form it sits in', async () => {
    const fixture = await mount();

    button(fixture, 'Create project')?.click();

    expect(fixture.componentInstance.submits()).toBe(1);
  });

  it('refuses a second submit while one is on its way, and says so', async () => {
    const fixture = await mount();
    fixture.componentInstance.pending.set(true);
    fixture.detectChanges();

    const waiting = button(fixture, 'Creating…');
    expect(waiting?.disabled).toBe(true);

    waiting?.click();
    expect(fixture.componentInstance.submits()).toBe(0);
  });

  it('reports a cancel without submitting', async () => {
    const fixture = await mount();

    button(fixture, 'Cancel')?.click();

    expect(fixture.componentInstance.cancels()).toBe(1);
    expect(fixture.componentInstance.submits()).toBe(0);
  });
});
