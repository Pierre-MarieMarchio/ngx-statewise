import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { LOCALE, findLocale } from '../../../../core/i18n';
import { SearchDialogComponent } from './search-dialog.component';

function mount() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [SearchDialogComponent],
    providers: [
      provideRouter([]),
      { provide: LOCALE, useValue: findLocale('en') },
    ],
  });

  const fixture = TestBed.createComponent(SearchDialogComponent);
  fixture.detectChanges();

  return fixture;
}

function type(fixture: ReturnType<typeof mount>, value: string) {
  const host = fixture.nativeElement as HTMLElement;
  const field = host.querySelector<HTMLInputElement>('.palette__input');

  if (field === null) {
    throw new Error('the palette has no input');
  }

  field.value = value;
  field.dispatchEvent(new Event('input'));
  fixture.detectChanges();

  return field;
}

describe('SearchDialogComponent', () => {
  it('shows nothing until something is typed', () => {
    const host = mount().nativeElement as HTMLElement;

    expect(host.querySelector('.palette__results')).toBeNull();
    expect(host.querySelector('.palette__empty')).not.toBeNull();
  });

  it('lists matches as the query is typed', () => {
    const fixture = mount();
    type(fixture, 'effects');

    const host = fixture.nativeElement as HTMLElement;
    const results = host.querySelectorAll('.palette__result');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].textContent).toContain('Effects');
  });

  it('says so when nothing matches', () => {
    const fixture = mount();
    type(fixture, 'zzzznotathing');

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.palette__results')).toBeNull();
    expect(host.querySelector('.palette__empty')?.textContent).toContain(
      'Nothing matches',
    );
  });

  it('walks the results with the arrow keys, and wraps round', () => {
    const fixture = mount();
    const field = type(fixture, 'effect');
    const host = fixture.nativeElement as HTMLElement;
    const count = host.querySelectorAll('.palette__result').length;

    const active = () =>
      [...host.querySelectorAll('.palette__result')].findIndex((element) =>
        element.classList.contains('palette__result--active'),
      );

    expect(active()).toBe(0);

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(active()).toBe(1);

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(active()).toBe(0);

    // Up from the first wraps to the last rather than sticking.
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(active()).toBe(count - 1);
  });

  it('navigates to the highlighted result on Enter, fragment included', () => {
    const fixture = mount();
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    navigate.mockClear();

    const field = type(fixture, 'lifecycle');
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(navigate).toHaveBeenCalledWith(['/', 'en', 'guide', 'effects'], {
      fragment: 'lifecycle',
    });
  });

  it('navigates when a result is clicked', () => {
    const fixture = mount();
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    navigate.mockClear();

    type(fixture, 'testing');
    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('.palette__result')?.click();

    expect(navigate).toHaveBeenCalled();
  });
});
