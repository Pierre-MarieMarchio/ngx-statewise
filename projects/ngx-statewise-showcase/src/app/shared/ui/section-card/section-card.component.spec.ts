import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SectionCardComponent } from './section-card.component';

@Component({
  imports: [SectionCardComponent],
  template: `
    <app-section-card heading="ALL TASK">
      <p class="the-content">Whatever the caller put in it.</p>
    </app-section-card>
  `,
})
class HostComponent {}

describe('SectionCardComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('titles the panel and projects its content into the body', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.section-card-title')?.textContent?.trim()).toBe(
      'ALL TASK',
    );
    expect(
      host.querySelector('.section-card-body .the-content'),
    ).not.toBeNull();
  });

  /** The heading is a real `h2`: the dashboard's outline runs h1 → h2 → … */
  it('makes the heading a second-level one', async () => {
    const fixture = await mount();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'h2.section-card-title',
      ),
    ).not.toBeNull();
  });
});
