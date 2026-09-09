import { TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { Theme } from './theme.enum';

describe('ThemeToggleComponent', () => {
  it('shows the icon of the theme in use and flips it on click', async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const icon = () => host.querySelector('mat-icon')?.textContent?.trim();

    expect(fixture.componentInstance.themeService.themeSignal()).toBe(
      Theme.DARK,
    );
    expect(icon()).toBe('dark_mode_outlined');

    host.querySelector<HTMLButtonElement>('button')?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.themeService.themeSignal()).toBe(
      Theme.LIGHT,
    );
    expect(icon()).toBe('light_mode');
  });
});
