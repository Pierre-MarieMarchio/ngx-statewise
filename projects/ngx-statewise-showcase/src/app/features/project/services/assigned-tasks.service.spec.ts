import { TestBed } from '@angular/core/testing';
import {
  fakeAuthSession,
  FakeAuthSession,
  sampleTask,
  sampleUser,
} from '@testing/fake-managers';
import { AssignedTasksService } from './assigned-tasks.service';
import { AUTH_SESSION } from '@app/features/common';

const TASKS = [
  sampleTask({ id: 'mine', assignedUserIds: ['user-1'] }),
  sampleTask({ id: 'theirs', assignedUserIds: ['user-2'] }),
  sampleTask({ id: 'shared', assignedUserIds: ['user-1', 'user-2'] }),
  sampleTask({ id: 'nobody', assignedUserIds: [] }),
];

describe('AssignedTasksService', () => {
  let assigned: AssignedTasksService;
  let authManager: FakeAuthSession;

  beforeEach(() => {
    authManager = fakeAuthSession(sampleUser({ userId: 'user-1' }));

    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_SESSION, useValue: authManager }],
    });

    assigned = TestBed.inject(AssignedTasksService);
  });

  it('keeps the tasks the signed-in user is on', () => {
    expect(assigned.ofCurrentUser(TASKS).map((task) => task.id)).toEqual([
      'mine',
      'shared',
    ]);
  });

  it('keeps none at all while nobody is signed in', () => {
    authManager.user.set(null);

    expect(assigned.ofCurrentUser(TASKS)).toEqual([]);
  });

  it('follows the session rather than reading it once', () => {
    authManager.user.set(sampleUser({ userId: 'user-2' }));

    expect(assigned.ofCurrentUser(TASKS).map((task) => task.id)).toEqual([
      'theirs',
      'shared',
    ]);
  });
});
