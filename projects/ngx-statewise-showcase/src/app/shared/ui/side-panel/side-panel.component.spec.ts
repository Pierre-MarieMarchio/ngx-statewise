import { TestBed } from '@angular/core/testing';
import { MatSidenav } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { SidePanelComponent } from './side-panel.component';

describe('SidePanelComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [SidePanelComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SidePanelComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('renders a drawer container', async () => {
    const fixture = await mount();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('mat-sidenav'),
    ).not.toBeNull();
  });

  it('starts closed, and opens when the signal says so', async () => {
    const fixture = await mount();
    const drawer = () =>
      (fixture.nativeElement as HTMLElement).querySelector('mat-sidenav');

    expect(fixture.componentInstance.opened()).toBe(false);
    expect(drawer()?.classList.contains('mat-drawer-opened')).toBe(false);

    fixture.componentInstance.opened.set(true);
    fixture.detectChanges();

    expect(drawer()?.classList.contains('mat-drawer-opened')).toBe(true);
  });

  /**
   * The reason the panel takes a `model` rather than three methods: the ways
   * the drawer closes itself, the backdrop and ESC, have to reach whoever
   * asked for it to open.
   *
   * The drawer is asked to report directly rather than clicked: it raises
   * `openedChange` off its own `transitionend`, which never fires under jsdom.
   * So the binding is what this asserts, and the transition that drives it is
   * Material's to keep. And `openedChange` is an async emitter, so the write
   * back lands a macrotask later, hence the wait rather than a bare
   * `detectChanges`.
   */
  it('follows the drawer back down when it closes itself', async () => {
    const fixture = await mount();
    fixture.componentInstance.opened.set(true);
    fixture.detectChanges();

    const drawer = fixture.debugElement.query(By.directive(MatSidenav))
      .componentInstance as MatSidenav;
    drawer.openedChange.emit(false);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.opened()).toBe(false);
  });
});
