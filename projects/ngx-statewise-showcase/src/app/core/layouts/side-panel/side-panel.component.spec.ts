import { TestBed } from '@angular/core/testing';
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

  it('starts closed and follows open, close and toggle', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.sidenav.opened).toBeFalse();

    component.open();
    expect(component.sidenav.opened).toBeTrue();

    component.close();
    expect(component.sidenav.opened).toBeFalse();

    component.toggle();
    expect(component.sidenav.opened).toBeTrue();
  });
});
