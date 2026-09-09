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

  it('lists one link per navigation item while logged in', async () => {
    const fixture = await mount();

    expect(
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('a[mat-item]'),
      ).length,
    ).toBe(ITEMS.length + 1);
  });

  it('hides the navigation items and the logout while logged out', async () => {
    const fixture = await mount(false);

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('a[mat-item]').length).toBe(1);
    expect(host.querySelector('.footer-groupe-button')).toBeNull();
  });

  it('asks whoever composes the shell to log out', async () => {
    const fixture = await mount();
    const asked: void[] = [];
    fixture.componentInstance.logout.subscribe((value) => asked.push(value));

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.footer-groupe-button button')
      ?.click();

    expect(asked.length).toBe(1);
  });
});
