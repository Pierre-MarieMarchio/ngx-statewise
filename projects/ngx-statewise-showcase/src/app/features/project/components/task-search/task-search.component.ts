import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

/** How long a typist gets to keep typing before the query goes out. */
const SETTLE_MS = 150;

/**
 * The search box, and the only thing in this application that debounces.
 *
 * The wait lives here rather than in the effect on purpose: how long to give a
 * typist is a question about a keyboard, not about state. And it is a plain
 * timer rather than an RxJS operator — the box holds one pending query, so
 * there is nothing a stream would add beyond a dependency.
 *
 * It deliberately does **not** debounce away the race. 150 ms of settling
 * against 200 ms of server latency means a fast typist still puts two searches
 * in flight, which is the whole point: that is what `concurrency: 'latest'` and
 * the `abortSignal` behind it are there to handle.
 */
@Component({
  selector: 'app-task-search',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './task-search.component.html',
  styleUrl: './task-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskSearchComponent {
  /** True while a query is on its way, so the box can say so. */
  public readonly searching = input(false);

  public readonly queried = output<string>();
  public readonly cleared = output<void>();

  public readonly query = signal('');

  private pending: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // A pending query outliving its box would dispatch into a torn-down view.
    inject(DestroyRef).onDestroy(() => {
      this.cancelPending();
    });
  }

  public onInput(value: string): void {
    this.query.set(value);
    this.cancelPending();

    // Emptying the box is not a query: it says there is no filter, and the
    // search in flight is no longer wanted.
    if (value.trim() === '') {
      this.cleared.emit();

      return;
    }

    this.pending = setTimeout(() => {
      this.queried.emit(value.trim());
    }, SETTLE_MS);
  }

  public clear(): void {
    this.query.set('');
    this.cancelPending();
    this.cleared.emit();
  }

  private cancelPending(): void {
    if (this.pending !== undefined) {
      clearTimeout(this.pending);
      this.pending = undefined;
    }
  }
}
