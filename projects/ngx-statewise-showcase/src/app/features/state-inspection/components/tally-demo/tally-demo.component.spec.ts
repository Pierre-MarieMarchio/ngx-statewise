import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { TallyState } from '../../states/tally/tally.state';
import {
  DEFERRED_DISPATCH_DELAY_MS,
  TallyDemoComponent,
} from './tally-demo.component';

describe('TallyDemoComponent', () => {
  let fixture: ComponentFixture<TallyDemoComponent>;
  let tallyState: TallyState;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const readout = (name: string): string =>
    host().querySelector(`[data-readout="${name}"]`)?.textContent?.trim() ?? '';

  const click = (label: string): void => {
    Array.from(host().querySelectorAll<HTMLButtonElement>('button'))
      .find((candidate) => candidate.textContent?.trim() === label)
      ?.click();

    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TallyDemoComponent],
      providers: [provideStatewise({})],
    }).compileComponents();

    tallyState = TestBed.inject(TallyState);
    tallyState.total = 0;
    tallyState.lastStep = 0;

    fixture = TestBed.createComponent(TallyDemoComponent);
    fixture.detectChanges();
  });

  /**
   * The whole point of the demo: the updater writes plain fields. Turning them
   * into signals would still work, and would stop demonstrating anything.
   */
  it('keeps the state in plain properties rather than signals', () => {
    expect(typeof tallyState.total).toBe('number');
    expect(typeof tallyState.lastStep).toBe('number');
  });

  it('starts at zero', () => {
    expect(readout('total')).toBe('0');
    expect(readout('last-step')).toBe('0');
  });

  it('adds the step of the button pressed', () => {
    click('+ 1');

    expect(tallyState.total).toBe(1);
    expect(readout('total')).toBe('1');
    expect(readout('last-step')).toBe('1');
  });

  it('accumulates across dispatches and remembers the last step', () => {
    click('+ 5');
    click('+ 1');
    click('+ 5');

    expect(tallyState.total).toBe(11);
    expect(readout('last-step')).toBe('5');
  });

  it('zeroes both fields on reset', () => {
    click('+ 5');
    click('reset');

    expect(tallyState.total).toBe(0);
    expect(readout('total')).toBe('0');
    expect(readout('last-step')).toBe('0');
  });

  it('dispatches the deferred increment once its timer fires', async () => {
    click('+ 1 deferred, outside Angular');

    expect(tallyState.total).toBe(0);

    await new Promise((settle) =>
      setTimeout(settle, DEFERRED_DISPATCH_DELAY_MS + 200),
    );

    expect(tallyState.total).toBe(1);
  });
});
