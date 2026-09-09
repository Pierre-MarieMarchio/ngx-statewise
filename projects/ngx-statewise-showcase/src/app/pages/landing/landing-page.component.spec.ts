import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  it('renders its content', async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(LandingPageComponent);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).textContent?.trim().length,
    ).toBeGreaterThan(0);
  });

  /**
   * A navigation, so a link: it used to be a `<button routerLink>`, which goes
   * nowhere you can open in a new tab, copy, or see before pressing.
   */
  it('offers the way in as a link, with an address', async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(LandingPageComponent);
    fixture.detectChanges();

    const signIn = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLAnchorElement>('a[href="/login"]');

    expect(signIn?.textContent?.trim()).toBe('sign in');
  });
});
