import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { GUIDE_PAGES } from '../guide/guide-pages';
import { CurrentPagePath, LOCALE, findLocale, type LocaleCode } from '../i18n';
import { HomeComponent } from './home.component';

function mount(code: LocaleCode = 'en') {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [HomeComponent],
    providers: [
      provideRouter([]),
      { provide: LOCALE, useValue: findLocale(code) },
    ],
  });

  const fixture = TestBed.createComponent(HomeComponent);
  fixture.detectChanges();

  return fixture;
}

describe('HomeComponent', () => {
  it('links to every page of the guide', () => {
    const host = mount().nativeElement as HTMLElement;

    expect(host.querySelectorAll('.contents__link').length).toBe(
      GUIDE_PAGES.length,
    );
  });

  it('titles the document, and tells the shell it is the landing page', () => {
    mount();

    expect(TestBed.inject(Title).getTitle()).toContain('ngx-statewise');
    expect(TestBed.inject(CurrentPagePath).path()).toBe('');
  });

  it('is localised', () => {
    const host = mount('fr').nativeElement as HTMLElement;

    expect(host.querySelector('.hero__subtitle')?.textContent).toContain(
      'Gestion d’état',
    );
    expect(host.querySelector('.button--primary')?.textContent).toContain(
      'Commencer',
    );
  });

  it('names every station of the cycle, and the way back', () => {
    const host = mount().nativeElement as HTMLElement;
    const stations = [...host.querySelectorAll('.cycle__station-name')].map(
      (station) => station.textContent?.trim(),
    );

    expect(stations).toEqual(['Action', 'Updater', 'Effect']);
    expect(host.querySelector('.cycle__return-text')?.textContent).toContain(
      'may return an action',
    );
  });
});
