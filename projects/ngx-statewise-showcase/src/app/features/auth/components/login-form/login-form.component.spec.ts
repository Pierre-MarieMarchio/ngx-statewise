import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { LoginFormComponent } from './login-form.component';

describe('LoginFormComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [LoginFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginFormComponent);
    fixture.detectChanges();
    return fixture;
  };

  const fill = (
    fixture: { nativeElement: unknown },
    name: string,
    value: string,
  ) => {
    const input = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLInputElement>(`input[formcontrolname="${name}"]`);
    input!.value = value;
    input!.dispatchEvent(new Event('input'));
  };

  it('renders an email and a password field', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('input[formcontrolname="email"]')).not.toBeNull();
    expect(
      host.querySelector('input[formcontrolname="password"]'),
    ).not.toBeNull();
  });

  it('hides the password until the reveal button is pressed', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;
    const passwordType = () =>
      host.querySelector<HTMLInputElement>('input[formcontrolname="password"]')
        ?.type;

    expect(passwordType()).toBe('password');

    host.querySelector<HTMLButtonElement>('button[matSuffix]')?.click();
    fixture.detectChanges();

    expect(passwordType()).toBe('text');
  });

  it('stays silent while the form is incomplete', async () => {
    const fixture = await mount();
    const submits: unknown[] = [];
    fixture.componentInstance.formSubmit.subscribe((v) => submits.push(v));

    fixture.componentInstance.handleSubmit();

    expect(submits).toEqual([]);
  });

  it('emits the credentials once both fields are filled', async () => {
    const fixture = await mount();
    const submits: unknown[] = [];
    fixture.componentInstance.formSubmit.subscribe((v) => submits.push(v));

    fill(fixture, 'email', 'admin@admin');
    fill(fixture, 'password', 'admin');
    fixture.componentInstance.handleSubmit();

    expect(submits).toEqual([{ email: 'admin@admin', password: 'admin' }]);
  });
  /**
   * Angular Material renders a `mat-error` only once its control has been
   * touched, so a submit on an untouched form used to say nothing at all.
   */
  it('names the fields it is missing when submitted empty', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('mat-error').length).toBe(0);

    fixture.componentInstance.handleSubmit();
    fixture.detectChanges();

    expect(
      Array.from(host.querySelectorAll('mat-error')).map((error) =>
        error.textContent?.trim(),
      ),
    ).toEqual(['An e-mail is required.', 'A password is required.']);
  });

  it('ties each error to the field it concerns', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.handleSubmit();
    fixture.detectChanges();

    const email = host.querySelector<HTMLInputElement>(
      'input[formcontrolname="email"]',
    );
    const describedBy = email?.getAttribute('aria-describedby');

    expect(describedBy).toBeTruthy();
    expect(host.querySelector(`#${describedBy}`)?.textContent).toContain(
      'An e-mail is required.',
    );
  });

  it('refuses a second submit while the first is running', async () => {
    const fixture = await mount();
    fixture.componentRef.setInput('pending', true);
    fixture.detectChanges();

    const submit = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('button[type="submit"]');

    expect(submit?.disabled).toBe(true);
  });

  it('names the reveal button rather than leaving its icon to speak', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;
    const reveal = () =>
      host.querySelector<HTMLButtonElement>('button[matSuffix]');

    expect(reveal()?.getAttribute('aria-label')).toBe('Show the password');

    reveal()?.click();
    fixture.detectChanges();

    expect(reveal()?.getAttribute('aria-label')).toBe('Hide the password');
  });
});
