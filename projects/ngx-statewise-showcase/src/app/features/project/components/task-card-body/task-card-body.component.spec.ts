import { TestBed } from '@angular/core/testing';
import { sampleTask } from '@testing/fake-managers';
import { TaskCardBodyComponent } from './task-card-body.component';

describe('TaskCardBodyComponent', () => {
  it('shows the title and the description of the task it was given', async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardBodyComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskCardBodyComponent);
    fixture.componentRef.setInput(
      'task',
      sampleTask({ title: 'Wire the board', description: 'Both callers.' }),
    );
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('mat-card-title')?.textContent?.trim()).toBe(
      'Wire the board',
    );
    expect(host.querySelector('mat-card-content p')?.textContent?.trim()).toBe(
      'Both callers.',
    );
  });
});
