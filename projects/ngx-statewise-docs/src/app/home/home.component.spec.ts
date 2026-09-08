import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GUIDE_PAGES } from '../guide/guide-pages';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  it('links to every page of the guide', async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const links = host.querySelectorAll('.contents__link');

    expect(links.length).toBe(GUIDE_PAGES.length);
  });
});
