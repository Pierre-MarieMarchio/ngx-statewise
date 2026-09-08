import {
  inject,
  Injectable,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActionHistory, injectStatewise, type Statewise } from 'ngx-statewise';
import { drainEffects, provideStatewiseTesting } from 'ngx-statewise/testing';

import { AppComponent } from './app.component';
import { counterActions, CounterState, counterUpdater } from './counter';
import { CounterEffects } from './counter.effects';

/**
 * A manager written the way a consumer writes one, so `injectStatewise` is
 * exercised through DI rather than called directly.
 */
@Injectable()
class CounterManager {
  public readonly state = inject(CounterState);

  private readonly statewise: Statewise = injectStatewise(counterUpdater);

  public increment(by: number): void {
    this.statewise.dispatch(counterActions.incremented(by));
  }

  public double(): Promise<void> {
    return this.statewise.dispatchAsync(counterActions.doubled());
  }
}

describe('ngx-statewise, installed from the packed package', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStatewiseTesting({ effects: [CounterEffects] }),
        CounterManager,
      ],
    });
  });

  it('runs an updater through a scoped dispatch', () => {
    const manager = TestBed.inject(CounterManager);

    manager.increment(2);

    expect(manager.state.value()).toBe(2);
  });

  it('settles an effect that answers with a follow-up action', async () => {
    const manager = TestBed.inject(CounterManager);

    manager.increment(3);
    await manager.double();
    await drainEffects();

    // 3, doubled to 6, then the effect's follow-up increment of 1.
    expect(manager.state.value()).toBe(7);
    expect(TestBed.inject(CounterEffects).seen).toEqual([3, 1]);
  });

  it('records what was dispatched', async () => {
    const manager = TestBed.inject(CounterManager);

    manager.increment(1);
    await drainEffects();

    expect(
      TestBed.inject(ActionHistory)
        .snapshot()
        .map((action) => action.type),
    ).toEqual([counterActions.incremented.type]);
  });

  it('renders a component wired to the library', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const textOf = (selector: string): string =>
      (
        (fixture.nativeElement as HTMLElement).querySelector(selector)
          ?.textContent ?? ''
      ).trim();

    await fixture.whenStable();

    expect(textOf('#value')).toBe('0');

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button')
      ?.click();
    await fixture.whenStable();

    expect(textOf('#value')).toBe('1');
    expect(textOf('#dispatched')).toBe('1');
  });
});
