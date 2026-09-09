import { TestBed } from '@angular/core/testing';
import { IconComponent, type IconName } from './icon.component';

const NAMES: IconName[] = [
  'menu',
  'close',
  'dark-mode',
  'light-mode',
  'translate',
  'chevron-left',
  'chevron-right',
  'edit',
  'info',
];

describe('IconComponent', () => {
  /**
   * The set is hand-traced, so a name with no drawing behind it would render an
   * empty box rather than fail. This counts the drawings.
   */
  it('draws every name it accepts', () => {
    for (const name of NAMES) {
      TestBed.resetTestingModule();
      const fixture = TestBed.createComponent(IconComponent);
      fixture.componentRef.setInput('name', name);
      fixture.detectChanges();

      const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

      expect(svg, `${name} renders no svg`).not.toBeNull();
      expect(
        svg?.children.length ?? 0,
        `${name} renders an empty svg`,
      ).toBeGreaterThan(0);
    }
  });

  it('hides itself from assistive technology, being decorative', () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'menu');
    fixture.detectChanges();

    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });
});
