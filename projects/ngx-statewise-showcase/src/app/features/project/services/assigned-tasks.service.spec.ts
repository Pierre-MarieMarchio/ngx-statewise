import { TestBed } from '@angular/core/testing';
import { AUTH_MANAGER } from '@shared/app-common/tokens';
import {
  fakeAuthManager,
  FakeAuthManager,
  sampleTask,
  sampleUser,
} from '@testing/fake-managers';
import { AssignedTasksService } from './assigned-tasks.service';

const TASKS = [
  sampleTask({ id: 'mine', assignedUserIds: ['user-1'] }),
  sampleTask({ id: 'theirs', assignedUserIds: ['user-2'] }),
  sampleTask({ id: 'shared', assignedUserIds: ['user-1', 'user-2'] }),
  sampleTask({ id: 'nobody', assignedUserIds: [] }),
];

describe('AssignedTasksService', () => {
  let assigned: AssignedTasksService;
  let authManager: FakeAuthManager;

  beforeEach(() => {
    authManager = fakeAuthManager(sampleUser({ userId: 'user-1' }));

    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_MANAGER, useValue: authManager }],
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
