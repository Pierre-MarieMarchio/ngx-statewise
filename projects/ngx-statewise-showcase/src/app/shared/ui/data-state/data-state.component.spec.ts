import { TestBed } from '@angular/core/testing';
import { DataStateComponent } from './data-state.component';

describe('DataStateComponent', () => {
  const mount = async (
    inputs: Record<string, unknown> = {},
  ): Promise<{ host: HTMLElement; component: DataStateComponent }> => {
    await TestBed.configureTestingModule({
      imports: [DataStateComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(DataStateComponent);
    fixture.componentRef.setInput('label', 'tasks');

    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }

    fixture.detectChanges();

    return {
      host: fixture.nativeElement as HTMLElement,
      component: fixture.componentInstance,
    };
  };

  it('shows nothing while the read is neither running nor failed', async () => {
    const { host } = await mount();

    expect(host.textContent?.trim()).toBe('');
    expect(host.querySelector('mat-progress-bar')).toBeNull();
  });

  it('shows a labelled progress bar while the read is running', async () => {
    const { host } = await mount({ loading: true });

    expect(
      host.querySelector('mat-progress-bar')?.getAttribute('aria-label'),
    ).toBe('Loading the tasks');
  });

  /** A failure nobody is looking at is a failure nobody hears about. */
  it('announces a failure through a live region', async () => {
    const { host } = await mount({ error: true });

    const banner = host.querySelector('[role="alert"]');

    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain('The tasks could not be loaded.');
  });

  it('prefers the wording it is given', async () => {
    const { host } = await mount({
      error: true,
      errorMessage: 'Those credentials were refused.',
    });

    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      'Those credentials were refused.',
    );
  });

  it('offers no retry unless the view asks for one', async () => {
    const { host } = await mount({ error: true });

    expect(host.querySelector('button')).toBeNull();
  });

  it('offers a retry when the view asks for one', async () => {
    const { host } = await mount({ error: true, retryable: true });

    expect(host.querySelector('button')?.textContent).toContain('Try again');
  });

  it('reports the retry to whoever can act on it', async () => {
    const { host, component } = await mount({ error: true, retryable: true });
    const retries: void[] = [];
    component.retried.subscribe(() => retries.push(undefined));

    host.querySelector('button')?.click();

    expect(retries.length).toBe(1);
  });

  it('shows both at once while a failed read is being retried', async () => {
    const { host } = await mount({ loading: true, error: true });

    expect(host.querySelector('mat-progress-bar')).not.toBeNull();
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
  });
});
