import { TestBed } from '@angular/core/testing';
import { ConfirmPanelComponent } from './confirm-panel.component';

describe('ConfirmPanelComponent', () => {
  const mount = async (
    inputs: Readonly<Record<string, unknown>> = {
      heading: 'Delete project',
      question: 'Analytics will be removed. This cannot be undone.',
      confirmLabel: 'Delete project',
    },
  ) => {
    await TestBed.configureTestingModule({
      imports: [ConfirmPanelComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ConfirmPanelComponent);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    return fixture;
  };

  const host = (fixture: { nativeElement: unknown }) =>
    fixture.nativeElement as HTMLElement;

  it('asks its question in the shell the forms wear', async () => {
    const fixture = await mount();

    expect(
      host(fixture).querySelector('.panel-form-title')?.textContent?.trim(),
    ).toBe('Delete project');
    expect(
      host(fixture)
        .querySelector('.confirm-panel-question')
        ?.textContent?.trim(),
    ).toContain('cannot be undone');
  });

  /**
   * `(ngSubmit)` fires only where a form directive is: without one this button
   * looks live and does nothing. Pressing it is the whole assertion.
   */
  it('answers when the button is pressed', async () => {
    const fixture = await mount();
    const answers: string[] = [];
    fixture.componentInstance.confirmed.subscribe(() => answers.push('yes'));

    host(fixture)
      .querySelector<HTMLButtonElement>('button[type="submit"]')
      ?.click();

    expect(answers).toEqual(['yes']);
  });

  it('reports the cancel, and repeats a refusal as it came', async () => {
    const fixture = await mount();
    const cancels: string[] = [];
    fixture.componentInstance.cancelled.subscribe(() => cancels.push('no'));

    host(fixture)
      .querySelector<HTMLButtonElement>('button[type="button"]')
      ?.click();
    fixture.componentRef.setInput(
      'refusal',
      'this project still holds 3 tasks',
    );
    fixture.detectChanges();

    expect(cancels).toEqual(['no']);
    expect(
      host(fixture).querySelector('[role="alert"]')?.textContent,
    ).toContain('still holds 3 tasks');
  });

  it('says it is working while it waits', async () => {
    const fixture = await mount();
    fixture.componentRef.setInput('pending', true);
    fixture.componentRef.setInput('pendingLabel', 'Deleting…');
    fixture.detectChanges();

    const button = host(fixture).querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );

    expect(button?.textContent?.trim()).toBe('Deleting…');
    expect(button?.disabled).toBe(true);
  });
});
