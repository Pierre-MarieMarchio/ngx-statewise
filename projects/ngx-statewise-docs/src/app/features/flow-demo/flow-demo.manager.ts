import { Injectable, computed, inject } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { demoLoginActions, demoResetAction } from './flow-demo.action';
import { FlowDemoState } from './flow-demo.state';
import { flowDemoUpdater } from './flow-demo.updater';

/** Which station the playhead sits on, for the diagram and the code beside it. */
export type DemoStation = 'action' | 'updater' | 'effect' | null;

@Injectable({ providedIn: 'root' })
export class FlowDemoManager {
  private readonly state = inject(FlowDemoState);
  private readonly statewise = injectStatewise(flowDemoUpdater);

  public readonly phase = this.state.phase.asReadonly();
  public readonly isLoading = this.state.isLoading.asReadonly();
  public readonly user = this.state.user.asReadonly();
  public readonly journal = this.state.journal.asReadonly();

  public readonly isRunning = computed(() => this.state.phase() === 'pending');
  public readonly hasRun = computed(() => this.state.phase() !== 'idle');

  /**
   * Which station is running right now, for the diagram and the code beside
   * it. Only the effect is ever caught in the act: the action and the updater
   * are one synchronous tick, so by the time anything can be painted they have
   * both already finished. Nothing runs once the cascade has settled, so this
   * is null again at the end rather than pointing at the last station to go.
   */
  public readonly station = computed<DemoStation>(() =>
    this.state.phase() === 'pending' ? 'effect' : null,
  );

  public run(): void {
    if (this.state.phase() === 'pending') {
      return;
    }

    this.statewise.dispatch(demoLoginActions.request());
  }

  public reset(): void {
    this.statewise.dispatch(demoResetAction());
  }

  /** Used by the spec, and by nothing else: awaits the whole cascade. */
  public async runAndSettle(): Promise<void> {
    await this.statewise.dispatchAsync(demoLoginActions.request());
  }
}
