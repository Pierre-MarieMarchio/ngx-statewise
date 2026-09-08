import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  it('renders its content', async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(LandingPageComponent);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).textContent?.trim().length,
    ).toBeGreaterThan(0);
  });
});
