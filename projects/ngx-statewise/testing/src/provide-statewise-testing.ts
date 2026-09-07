import {
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import {
  provideStatewise,
  ɵSTRICT_DISPATCH,
  type StatewiseConfig,
} from 'ngx-statewise';

export interface StatewiseTestingConfig extends StatewiseConfig {
  /**
   * Keeps the misrouted-dispatch check on. Turn it off for a suite that
   * deliberately dispatches an action without attaching its updater.
   *
   * @default true
   */
  readonly strict?: boolean;
}

/**
 * Wires ngx-statewise for a `TestBed`. Same options as `provideStatewise`,
 * with the action history enabled by default so a test can assert what was
 * dispatched without configuring anything.
 */
export function provideStatewiseTesting(
  config: StatewiseTestingConfig = {},
): EnvironmentProviders {
  const { strict = true, ...statewise } = config;

  return makeEnvironmentProviders([
    provideStatewise({ history: { limit: 100 }, ...statewise }),
    // Provided after provideStatewise, so this value wins.
    ...(strict ? [] : [{ provide: ɵSTRICT_DISPATCH, useValue: false }]),
  ]);
}
