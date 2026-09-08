import { TestBed } from '@angular/core/testing';
import { ProjectsPageComponent } from './projects-page.component';

describe('ProjectsPageComponent', () => {
  it('renders its content', async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsPageComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProjectsPageComponent);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).textContent?.trim().length,
    ).toBeGreaterThan(0);
  });
});
