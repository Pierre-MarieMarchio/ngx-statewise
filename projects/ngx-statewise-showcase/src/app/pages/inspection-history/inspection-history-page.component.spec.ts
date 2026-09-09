import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  injectStatewise,
  provideStatewise,
  type Statewise,
} from 'ngx-statewise';
import { fakeTaskManager } from '@testing/fake-managers';
import { noticeActions, noticeUpdater } from '@app/features/inspection/states';
import { tallyUpdater } from '@app/features/inspection/states';
import {
  InspectionHistoryPageComponent,
  MAX_PAYLOAD_LENGTH,
  TRACKED_ACTION_TYPES,
} from './inspection-history-page.component';
import { TaskManager } from '@app/features/project/states/task/task.manager';
import { at } from '@testing/at';

describe('InspectionHistoryPageComponent', () => {
  let fixture: ComponentFixture<InspectionHistoryPageComponent>;
  let outside: Statewise;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const rows = (): string[][] =>
    Array.from(host().querySelectorAll('tr[mat-row]')).map((row) =>
      Array.from(row.querySelectorAll('td')).map(
        (cell) => cell.textContent?.trim() ?? '',
      ),
    );

  const click = (label: string): void => {
    Array.from(host().querySelectorAll<HTMLButtonElement>('button'))
      .find((candidate) => candidate.textContent?.trim() === label)
      ?.click();

    fixture.detectChanges();
  };

  const readout = (name: string): string =>
    host().querySelector(`[data-readout="${name}"]`)?.textContent?.trim() ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectionHistoryPageComponent],
      providers: [
        provideStatewise({
          updaters: [noticeUpdater],
          history: { limit: 50 },
        }),
        { provide: TaskManager, useValue: fakeTaskManager() },
      ],
    }).compileComponents();

    outside = TestBed.runInInjectionContext(() =>
      injectStatewise(tallyUpdater),
    );

    fixture = TestBed.createComponent(InspectionHistoryPageComponent);
    fixture.detectChanges();
  });

  /**
   * The labels must never repeat a type name the creator already owns, which
   * is what `ofType` is for.
   */
  it('names the tracked types off their creators', () => {
    expect(TRACKED_ACTION_TYPES.map((tracked) => tracked.type)).toEqual([
      'NOTICE_RAISED',
      'NOTICE_CLEARED',
      'TALLY_INCREMENTED',
      'TASK_SUCCESS',
      'PROJECT_SUCCESS',
    ]);
  });

  it('shows nothing before the history has been read', () => {
    expect(rows()).toEqual([]);
    expect(readout('empty').length).toBeGreaterThan(0);
  });

  it('lists an action once the history is read', () => {
    click('raise a notice');

    expect(rows()).toEqual([
      ['1', 'NOTICE_RAISED', '"raised from the history"'],
    ]);
    expect(readout('total')).toBe('1');
  });

  it('records the actions of every handle, not only its own', () => {
    outside.dispatch(noticeActions.raised('from elsewhere'));
    click('refresh');

    expect(rows().map((row) => row[1])).toEqual(['NOTICE_RAISED']);
    expect(at(at(rows(), 0), 2)).toBe('"from elsewhere"');
  });

  /**
   * `snapshot()` is a plain array: an action dispatched after the last
   * read stays invisible until the next one.
   */
  it('keeps showing the last snapshot until it is read again', () => {
    click('raise a notice');
    expect(readout('total')).toBe('1');

    outside.dispatch(noticeActions.raised('unseen'));
    fixture.detectChanges();

    expect(readout('total')).toBe('1');

    click('refresh');

    expect(readout('total')).toBe('2');
  });

  it('counts the actions of each tracked type', () => {
    click('raise a notice');
    click('increment the tally');
    click('increment the tally');

    const counts = fixture.componentInstance.counts();

    expect(
      counts
        .filter((tracked) => tracked.count > 0)
        .map((tracked) => [tracked.type, tracked.count]),
    ).toEqual([
      ['NOTICE_RAISED', 1],
      ['TALLY_INCREMENTED', 2],
    ]);
  });

  it('narrows the table to the type filtered on, and back again', () => {
    click('raise a notice');
    click('increment the tally');

    expect(rows().length).toBe(2);

    fixture.componentInstance.filterBy('TALLY_INCREMENTED');
    fixture.detectChanges();

    expect(rows().map((row) => row[1])).toEqual(['TALLY_INCREMENTED']);
    expect(readout('filter')).toBe('TALLY_INCREMENTED');

    fixture.componentInstance.filterBy('TALLY_INCREMENTED');
    fixture.detectChanges();

    expect(rows().length).toBe(2);
  });

  it('renumbers the rows it shows while a filter is on', () => {
    click('increment the tally');
    click('raise a notice');
    click('increment the tally');

    fixture.componentInstance.filterBy('TALLY_INCREMENTED');
    fixture.detectChanges();

    expect(rows().map((row) => row[0])).toEqual(['1', '2']);
  });

  it('clears the filter', () => {
    click('raise a notice');
    fixture.componentInstance.filterBy('NOTICE_RAISED');
    fixture.detectChanges();

    click('clear filter');

    expect(fixture.componentInstance.selectedType()).toBeNull();
  });

  it('leaves the payload column empty for an action carrying none', () => {
    outside.dispatch(noticeActions.cleared());
    click('refresh');

    expect(rows()).toEqual([['1', 'NOTICE_CLEARED', '']]);
  });

  it('cuts a long payload short rather than flooding the row', () => {
    outside.dispatch(noticeActions.raised('x'.repeat(MAX_PAYLOAD_LENGTH * 2)));
    click('refresh');

    const payload = at(at(rows(), 0), 2);

    expect(payload.length).toBe(MAX_PAYLOAD_LENGTH + 1);
    expect(payload.endsWith('…')).toBe(true);
  });

  it('leaves a short payload whole', () => {
    outside.dispatch(noticeActions.raised('short'));
    click('refresh');

    expect(at(at(rows(), 0), 2)).toBe('"short"');
  });
});
