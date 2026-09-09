import { Injectable, signal } from '@angular/core';

/**
 * Where the flow currently is. `pending` is the only phase that lasts: the
 * action and the updater are one synchronous tick, and the effect is the part
 * that takes time. That asymmetry is the whole point of the demo.
 */
export type DemoPhase = 'idle' | 'pending' | 'done';

/** One line of the journal: what was dispatched, and who sent it. */
export interface DemoDispatch {
  readonly type: string;
  /** `true` when an effect returned it rather than the button sending it. */
  readonly returned: boolean;
}

@Injectable({ providedIn: 'root' })
export class FlowDemoState {
  public phase = signal<DemoPhase>('idle');

  /** The two fields the updater writes. They are the demo's whole state. */
  public isLoading = signal(false);
  public user = signal<string | null>(null);

  /** Every action that actually went through, oldest first. */
  public journal = signal<readonly DemoDispatch[]>([]);
}
