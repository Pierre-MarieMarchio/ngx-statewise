import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { NavShellComponent } from './nav-shell.component';

const ITEMS = [
  { icon: 'Dashboard', label: 'Dashboard', route: 'home' },
  { icon: 'Task_Alt', label: 'Task', route: 'task' },
];

describe('NavShellComponent', () => {
  const mount = async (isLoggedIn = true) => {
    await TestBed.configureTestingModule({
      imports: [NavShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(NavShellComponent);
    fixture.componentRef.setInput('navigationItems', ITEMS);
    fixture.componentRef.setInput('isLoggedIn', isLoggedIn);
    fixture.detectChanges();
    return fixture;
  };

  const links = (host: HTMLElement): HTMLAnchorElement[] =>
    Array.from(host.querySelectorAll<HTMLAnchorElement>('nav a'));

  it('lists one link per navigation item while logged in', async () => {
    const fixture = await mount();

    expect(links(fixture.nativeElement as HTMLElement).length).toBe(
      ITEMS.length + 1,
    );
  });

  it('hides the navigation items and the logout while logged out', async () => {
    const fixture = await mount(false);

    const host = fixture.nativeElement as HTMLElement;

    expect(links(host).length).toBe(1);
    expect(host.querySelector('.footer-groupe-button')).toBeNull();
  });

  /** A landmark, so a screen reader can jump straight to it or straight past. */
  it('names its navigation landmark', async () => {
    const fixture = await mount();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('nav')
        ?.getAttribute('aria-label'),
    ).toBe('Main');
  });

  /**
   * The word used to sit outside the button, so it named nothing and clicking
   * it did nothing.
   */
  it('asks whoever composes the shell to log out, from the word itself', async () => {
    const fixture = await mount();
    const asked: void[] = [];
    fixture.componentInstance.logout.subscribe((value) => asked.push(value));

    const button = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('button.footer-groupe-button');

    expect(button?.querySelector('span')?.textContent?.trim()).toBe('logout');

    button?.click();

    expect(asked.length).toBe(1);
  });
});
