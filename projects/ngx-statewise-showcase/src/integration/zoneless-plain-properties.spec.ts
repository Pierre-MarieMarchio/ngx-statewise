import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Injectable,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  defineActionsGroup,
  defineUpdater,
  injectStatewise,
  payload,
  type Statewise,
} from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';

/**
 * What the guide claims about plain properties, measured rather than deduced.
 *
 * The states guide offers plain properties as a second shape and states the
 * cost: "a component reading one has no way of knowing it changed, so you mark
 * it for check yourself." Under zoneless change detection that sentence needed
 * checking, because neither Zone.js nor a signal is there to schedule anything
 * and the library never calls `markForCheck` or `ApplicationRef.tick` itself.
 *
 * It holds. `markForCheck()` is what a zoneless application has to do, and it
 * is enough — Angular's own scheduler takes the notification. The three specs
 * below are the difference between a documented cost and a documented lie.
 *
 * Caveat on the measurement, stated because it is real: the showcase's test
 * polyfills still load Zone.js, so this exercises zoneless *change detection*
 * rather than a build with no Zone.js at all. The first spec is what says that
 * distinction does not matter here — if the Zone-driven tick were running, the
 * DOM would follow on its own, and it does not.
 */
const stateActions = defineActionsGroup({
  source: 'ZONELESSSTATE',
  events: { bumped: payload<number>() },
});

@Injectable({ providedIn: 'root' })
class PlainState {
  public total = 0;
}

@Injectable({ providedIn: 'root' })
class SignalState {
  public readonly total = signal(0);
}

const plainUpdater = defineUpdater(PlainState, (on) => {
  on(stateActions.bumped, (state, step) => {
    state.total += step;
  });
});

const signalUpdater = defineUpdater(SignalState, (on) => {
  on(stateActions.bumped, (state, step) => {
    state.total.update((current) => current + step);
  });
});

@Component({
  selector: 'app-plain-readout',
  template: `<span data-readout="total">{{ state.total }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PlainReadoutComponent {
  public readonly state = inject(PlainState);

  private readonly changeDetector = inject(ChangeDetectorRef);

  /** What a zoneless application has to do for a plain property, and no more. */
  public markForCheck(): void {
    this.changeDetector.markForCheck();
  }
}

@Component({
  selector: 'app-signal-readout',
  template: `<span data-readout="total">{{ state.total() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalReadoutComponent {
  public readonly state = inject(SignalState);
}

describe('plain properties under zoneless change detection', () => {
  let statewise: Statewise;

  const readout = (element: unknown): string =>
    (element as HTMLElement)
      .querySelector('[data-readout="total"]')
      ?.textContent?.trim() ?? '';

  function configure(updater: ReturnType<typeof defineUpdater>): void {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStatewiseTesting({ updaters: [updater] }),
      ],
    });

    statewise = TestBed.runInInjectionContext(() => injectStatewise());
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('leaves the view behind when an updater writes a plain property', async () => {
    configure(plainUpdater);
    const fixture = TestBed.createComponent(PlainReadoutComponent);
    await fixture.whenStable();

    await statewise.dispatchAsync(stateActions.bumped(5));
    await fixture.whenStable();

    // The state moved and the view did not. This is the cost the guide names,
    // and it is the reason signals are the shape to reach for.
    expect(TestBed.inject(PlainState).total).toBe(5);
    expect(readout(fixture.nativeElement)).toBe('0');
  });

  it('catches up once the component marks itself for check', async () => {
    configure(plainUpdater);
    const fixture = TestBed.createComponent(PlainReadoutComponent);
    await fixture.whenStable();

    await statewise.dispatchAsync(stateActions.bumped(7));
    fixture.componentInstance.markForCheck();
    await fixture.whenStable();

    // Zoneless does not make this impossible, only manual: `markForCheck`
    // notifies Angular's own scheduler, with no Zone.js involved.
    expect(readout(fixture.nativeElement)).toBe('7');
  });

  it('needs none of that when the state is a signal', async () => {
    configure(signalUpdater);
    const fixture = TestBed.createComponent(SignalReadoutComponent);
    await fixture.whenStable();

    await statewise.dispatchAsync(stateActions.bumped(9));
    await fixture.whenStable();

    expect(readout(fixture.nativeElement)).toBe('9');
  });
});
