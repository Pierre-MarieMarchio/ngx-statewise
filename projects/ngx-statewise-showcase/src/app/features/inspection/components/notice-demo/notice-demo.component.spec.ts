import { ComponentFixture, TestBed } from '@angular/core/testing';
import { injectStatewise, provideStatewise } from 'ngx-statewise';
import { NoticeState } from '../../states/notice/notice.state';
import { noticeActions } from '../../states/notice/notice.action';
import { noticeUpdater } from '../../states/notice/notice.updater';
import { NoticeDemoComponent } from './notice-demo.component';

describe('NoticeDemoComponent', () => {
  let fixture: ComponentFixture<NoticeDemoComponent>;
  let noticeState: NoticeState;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const readout = (name: string): string =>
    host().querySelector(`[data-readout="${name}"]`)?.textContent?.trim() ?? '';

  const click = (label: string): void => {
    const button = Array.from(
      host().querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.trim() === label);

    button?.click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoticeDemoComponent],
      providers: [provideStatewise({ updaters: [noticeUpdater] })],
    }).compileComponents();

    fixture = TestBed.createComponent(NoticeDemoComponent);
    noticeState = TestBed.inject(NoticeState);
    fixture.detectChanges();
  });

  it('starts with no notice raised', () => {
    expect(readout('message')).toBe('(none)');
    expect(readout('count')).toBe('0');
  });

  it('raises the notice from a handle owning no updater', () => {
    click('injectStatewise()');

    expect(noticeState.message()).toBe(
      'raised from a handle owning no updater',
    );
    expect(readout('count')).toBe('1');
  });

  it('raises the notice from a handle owning an unrelated updater', () => {
    click('injectStatewise(projectUpdater)');

    expect(noticeState.message()).toBe(
      'raised from a handle owning the project updater',
    );
    expect(readout('count')).toBe('1');
  });

  it('clears the message without forgetting how many were raised', () => {
    click('injectStatewise()');
    click('injectStatewise(projectUpdater)');
    click('Clear');

    expect(readout('message')).toBe('(none)');
    expect(readout('count')).toBe('2');
  });

  /**
   * The component owning the updater would satisfy the tests above just as
   * well, so reach the same state from a handle built outside of it: only a
   * globally registered updater answers that.
   */
  it('is reachable from a handle built outside the component', () => {
    const outside = TestBed.runInInjectionContext(() => injectStatewise());

    outside.dispatch(noticeActions.raised('from outside'));

    expect(noticeState.message()).toBe('from outside');
  });
});
