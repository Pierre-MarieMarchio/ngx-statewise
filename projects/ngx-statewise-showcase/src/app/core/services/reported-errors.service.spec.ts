import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ReportedErrors } from './reported-errors.service';

describe('ReportedErrors', () => {
  let reported: ReportedErrors;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    reported = TestBed.inject(ReportedErrors);
  });

  const messages = (): readonly string[] =>
    reported.all().map((entry) => entry.message);

  describe('naming what failed', () => {
    it('reads the message off an Error', () => {
      reported.record(new Error('the handle owns no updater'));

      expect(messages()).toEqual(['the handle owns no updater']);
    });

    /**
     * The regression this whole function exists for: `HttpErrorResponse`
     * implements `Error` without extending it, so it fell through to
     * `String()` and the panel read `[object Object]`.
     */
    it('prefers the server sentence on a refused request', () => {
      reported.record(
        new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          url: 'http://localhost/api/Project',
          error: { message: 'a project is already called "HR Platform"' },
        }),
      );

      expect(messages()).toEqual(['a project is already called "HR Platform"']);
    });

    it('falls back to the transport sentence when the server sent none', () => {
      reported.record(
        new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' }),
      );

      const [only] = messages();
      expect(only).toContain('Http failure response');
      expect(only).not.toContain('[object Object]');
    });

    it('reads a plain object that carries a message', () => {
      reported.record({ message: 'answered nothing while promising one' });

      expect(messages()).toEqual(['answered nothing while promising one']);
    });

    it('stringifies anything else, including what carries no message', () => {
      reported.record('TASK_REQUEST belongs to the task manager');
      reported.record({ code: 7 });

      expect(messages()).toEqual([
        '[object Object]',
        'TASK_REQUEST belongs to the task manager',
      ]);
    });
  });

  describe('keeping them', () => {
    it('puts the newest first, and stamps each with a time', () => {
      reported.record(new Error('first'));
      reported.record(new Error('second'));

      expect(messages()).toEqual(['second', 'first']);
      expect(reported.all()[0]?.at).toEqual(expect.any(String));
    });

    it('keeps twenty at most, dropping the oldest', () => {
      for (let index = 0; index < 25; index += 1) {
        reported.record(new Error(`failure ${String(index)}`));
      }

      expect(reported.all()).toHaveLength(20);
      expect(messages()[0]).toBe('failure 24');
      expect(messages()).not.toContain('failure 4');
    });

    it('clears them', () => {
      reported.record(new Error('gone'));
      reported.clear();

      expect(reported.all()).toEqual([]);
    });
  });
});
