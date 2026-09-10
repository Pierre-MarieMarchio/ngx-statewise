import type { OutputRef } from '@angular/core';
import type { Task } from '@app/features/project/models';
import { sampleTask } from '@testing/fake-managers';

interface TaskTableFixture {
  readonly nativeElement: unknown;
  readonly componentInstance: { readonly taskSelected: OutputRef<Task> };
}

/**
 * Presses the action button of the first row, and reports what the table said.
 *
 * The four tables answer this the same way, so the assertion lives here once:
 * the button's accessible name, and the ids it emitted. One of them, since
 * the press must not also reach the row's click.
 */
export function openFirstRow(fixture: TaskTableFixture): {
  readonly name: string | null;
  readonly emitted: readonly string[];
} {
  const emitted: string[] = [];
  fixture.componentInstance.taskSelected.subscribe((task) =>
    emitted.push(task.id),
  );

  const button = (
    fixture.nativeElement as HTMLElement
  ).querySelector<HTMLButtonElement>('td.open-cell button');

  button?.click();

  return { name: button?.getAttribute('aria-label') ?? null, emitted };
}

/**
 * What `openFirstRow` reports for a table whose first row is `sampleTask()`,
 * which is three of the four. The literal written out four times was the same
 * two lines four times, and counted as duplication rather than as coverage.
 */
export function openedSampleTask(id = 'task-1'): {
  readonly name: string;
  readonly emitted: readonly string[];
} {
  return { name: `Open ${sampleTask().title}`, emitted: [id] };
}
