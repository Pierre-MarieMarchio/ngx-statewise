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
});
