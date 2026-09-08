import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { noticeUpdater } from '@app/features/state-inspection/states';
import { DocsPageComponent, DOCS_SECTIONS } from './docs-page.component';

describe('DocsPageComponent', () => {
  let fixture: ComponentFixture<DocsPageComponent>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocsPageComponent],
      providers: [provideStatewise({ updaters: [noticeUpdater] })],
    }).compileComponents();

    fixture = TestBed.createComponent(DocsPageComponent);
    fixture.detectChanges();
  });

  it('renders one panel per documented mechanism', () => {
    expect(host().querySelectorAll('mat-expansion-panel').length).toBe(
      DOCS_SECTIONS.length,
    );
  });

  it('titles every panel', () => {
    expect(
      Array.from(host().querySelectorAll('mat-panel-title')).map((title) =>
        title.textContent?.trim(),
      ),
    ).toEqual(DOCS_SECTIONS.map((section) => section.title));
  });

  it('gives every section a summary, a snippet and a source to look at', () => {
    for (const section of DOCS_SECTIONS) {
      expect(section.summary.length, `${section.id} summary`).toBeGreaterThan(
        0,
      );
      expect(section.snippet.length, `${section.id} snippet`).toBeGreaterThan(
        0,
      );
      expect(section.seenIn, `${section.id} seenIn`).toMatch(/\.ts$/);
    }
  });

  it('keeps the section ids unique, since they anchor the panels', () => {
    const ids = DOCS_SECTIONS.map((section) => section.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(
      Array.from(host().querySelectorAll('mat-expansion-panel')).map((panel) =>
        panel.getAttribute('data-section'),
      ),
    ).toEqual(ids);
  });
});
