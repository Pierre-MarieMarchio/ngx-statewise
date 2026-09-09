import { TestBed } from '@angular/core/testing';
import { drainEffects, provideStatewiseTesting } from 'ngx-statewise/testing';
import { DEMO_LATENCY_MS, FlowDemoEffect } from './flow-demo.effect';
import { FlowDemoManager } from './flow-demo.manager';
import { flowDemoUpdater } from './flow-demo.updater';

function manager(): FlowDemoManager {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideStatewiseTesting({
        effects: [FlowDemoEffect],
        updaters: [flowDemoUpdater],
      }),
      // The pretend request is there for the reader's eye, not for the suite.
      { provide: DEMO_LATENCY_MS, useValue: 0 },
    ],
  });

  return TestBed.inject(FlowDemoManager);
}

describe('the landing page demo', () => {
  it('starts with nothing dispatched and no state written', () => {
    const demo = manager();

    expect(demo.phase()).toBe('idle');
    expect(demo.isLoading()).toBe(false);
    expect(demo.user()).toBeNull();
    expect(demo.journal()).toEqual([]);
    expect(demo.station()).toBeNull();
  });

  it('writes the state before the effect runs, which is the point of it', async () => {
    const demo = manager();

    demo.run();

    // Synchronously after the dispatch, and before the effect has resolved:
    // the updater has already been through.
    expect(demo.isLoading()).toBe(true);
    expect(demo.phase()).toBe('pending');
    expect(demo.station()).toBe('effect');

    await drainEffects();

    // The effect only reaches for the real address when it found the flag
    // already written, so this asserts the ordering rather than a string.
    expect(demo.user()).toBe('ada@example.com');
    expect(demo.isLoading()).toBe(false);
    expect(demo.phase()).toBe('done');
  });

  it('records the action it was given and the one the effect returned', async () => {
    const demo = manager();

    await demo.runAndSettle();

    expect(demo.journal()).toEqual([
      { type: 'DEMO_LOGIN_REQUEST', returned: false },
      { type: 'DEMO_LOGIN_SUCCESS', returned: true },
    ]);
  });

  it('ignores a second run while one is still in flight', () => {
    const demo = manager();

    demo.run();
    demo.run();

    expect(demo.journal().length).toBe(1);
  });

  it('goes back to the start, so it can be played again', async () => {
    const demo = manager();

    await demo.runAndSettle();
    demo.reset();

    expect(demo.phase()).toBe('idle');
    expect(demo.user()).toBeNull();
    expect(demo.journal()).toEqual([]);

    await demo.runAndSettle();

    expect(demo.journal().length).toBe(2);
  });
});
