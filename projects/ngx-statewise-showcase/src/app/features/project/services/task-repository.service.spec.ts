import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { sampleTask } from '@testing/fake-managers';
import { TaskRepositoryService } from './task-repository.service';

/**
 * The one thing worth asserting about this repository, and the reason the
 * search exists: that abandoning a run **stops the request**, rather than
 * merely dropping its answer.
 *
 * `HttpClient` takes no `AbortSignal`, so `search` bridges the signal to
 * unsubscription. Only the testing controller can see the difference: it
 * reports a torn-down request as `cancelled`, which is exactly the thing
 * `concurrency: 'latest'` alone does not achieve.
 */
describe('TaskRepositoryService.search', () => {
  let repository: TaskRepositoryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    repository = TestBed.inject(TaskRepositoryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  const pendingSearch = (query: string, abortSignal: AbortSignal) => {
    const answer = repository.search(query, 'user-1', abortSignal);
    const request = http.expectOne(
      (candidate) =>
        candidate.url === 'http://localhost/api/Task/search' &&
        candidate.params.get('q') === query,
    );

    return { answer, request };
  };

  it('asks for the query, on behalf of the user asking', () => {
    const controller = new AbortController();
    const { request } = pendingSearch('viewer', controller.signal);

    expect(request.request.params.get('userId')).toBe('user-1');

    request.flush([sampleTask()]);
  });

  it('answers with what the server matched', async () => {
    const controller = new AbortController();
    const { answer, request } = pendingSearch('viewer', controller.signal);

    request.flush([sampleTask({ id: 'matched' })]);

    expect((await answer).map((task) => task.id)).toEqual(['matched']);
  });

  /** The assertion this whole lot is for. */
  it('cancels the request itself when the run is abandoned', async () => {
    const controller = new AbortController();
    const { answer, request } = pendingSearch('ang', controller.signal);

    expect(request.cancelled).toBe(false);

    controller.abort();

    expect(request.cancelled).toBe(true);
    // The source completed without emitting, so the promise rejects rather
    // than resolving with something the caller would mistake for a result.
    await expect(answer).rejects.toThrow();
  });

  it('leaves a request alone while its run is still wanted', () => {
    const controller = new AbortController();
    const { request } = pendingSearch('angular', controller.signal);

    expect(request.cancelled).toBe(false);

    request.flush([]);
  });
});
