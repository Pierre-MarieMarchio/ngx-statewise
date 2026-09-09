import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { sampleTask } from '@testing/fake-managers';
import type { Task } from '../../models';
import { TaskOpenColumnComponent } from './task-open-column.component';

const TASKS = [sampleTask(), sampleTask({ id: 'task-2', title: 'Second' })];

@Component({
  imports: [MatTableModule, TaskOpenColumnComponent],
  template: `
    <table mat-table [dataSource]="tasks">
      <ng-container matColumnDef="title">
        <th mat-header-cell *matHeaderCellDef>Title</th>
        <td mat-cell *matCellDef="let row">{{ row.title }}</td>
      </ng-container>

      @if (withOpen()) {
        <app-task-open-column (opened)="opened.push($event)" />
      }

      <tr mat-header-row *matHeaderRowDef="columns()"></tr>
      <tr
        mat-row
        (click)="rowPresses.push(row)"
        *matRowDef="let row; columns: columns()"
      ></tr>
    </table>
  `,
})
class HostComponent {
  public readonly tasks = TASKS;
  public readonly withOpen = signal(true);
  public readonly columns = computed(() =>
    this.withOpen() ? ['title', 'open'] : ['title'],
  );

  public readonly opened: Task[] = [];
  public readonly rowPresses: Task[] = [];
}

describe('TaskOpenColumnComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    return fixture;
  };

  const buttons = (host: HTMLElement): HTMLButtonElement[] =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('td.open-cell button'));

  /** A column declared in a component is not content of the table around it. */
  it('adds its column to the table it sits in', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;

    expect(
      Array.from(host.querySelectorAll('th')).map((cell) =>
        cell.textContent?.trim(),
      ),
    ).toEqual(['Title', 'Open']);
    expect(buttons(host).length).toBe(TASKS.length);
  });

  it('names each button after the task it opens', async () => {
    const fixture = await mount();

    expect(
      buttons(fixture.nativeElement as HTMLElement).map((button) =>
        button.getAttribute('aria-label'),
      ),
    ).toEqual(['Open Wire the showcase to a smoke test', 'Open Second']);
  });

  /** One press is one selection, whatever a caller listens to above. */
  it('reports the task without the row hearing the press too', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;

    buttons(host).at(1)?.click();

    expect(fixture.componentInstance.opened.map((task) => task.id)).toEqual([
      'task-2',
    ]);
    expect(fixture.componentInstance.rowPresses).toEqual([]);
  });

  it('takes its column away with it', async () => {
    const fixture = await mount();
    fixture.componentInstance.withOpen.set(false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(
      Array.from(host.querySelectorAll('th')).map((cell) =>
        cell.textContent?.trim(),
      ),
    ).toEqual(['Title']);
    expect(buttons(host)).toEqual([]);
  });
});
