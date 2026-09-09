import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import { noticeActions, noticeUpdater } from '../../states';
import { NoticeListenerService } from './notice-listener.service';

/**
 * The effect is registered in the injection context of whoever provides the
 * service, so these specs create that injector themselves and destroy it.
 */
describe('NoticeListenerService', () => {
  let statewise: Statewise;
  let owner: Injector;
  let listener: NoticeListenerService;

  const raise = (): void => {
    statewise.dispatch(noticeActions.raised('raised by a spec'));
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewiseTesting({ updaters: [noticeUpdater] })],
    });

    statewise = TestBed.runInInjectionContext(() => injectStatewise());
    owner = TestBed.inject(Injector);
    listener = runInInjectionContext(owner, () => new NoticeListenerService());
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('hears nothing before anything is raised', () => {
    expect(listener.heardCount()).toBe(0);
    expect(listener.isListening()).toBe(true);
  });

  it('counts the notices raised anywhere', () => {
    raise();
    raise();

    expect(listener.heardCount()).toBe(2);
  });

  /** The rarer case `EffectRef` exists for: stopping before destruction. */
  it('stops counting once its effect is destroyed', () => {
    raise();

    listener.stopListening();
    raise();

    expect(listener.heardCount()).toBe(1);
    expect(listener.isListening()).toBe(false);
  });
});
