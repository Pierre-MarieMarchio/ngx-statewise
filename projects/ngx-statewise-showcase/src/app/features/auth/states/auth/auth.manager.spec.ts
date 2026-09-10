import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { sampleUser } from '@testing/fake-managers';
import { AuthManager } from './auth.manager';
import { AuthState } from './auth.state';

describe('AuthManager', () => {
  let manager: AuthManager;
  let state: AuthState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewise({})],
    });

    state = TestBed.inject(AuthState);
    state.user.set(null);
    manager = TestBed.inject(AuthManager);
  });

  it('exposes the state read-only', () => {
    expect(manager.user()).toBeNull();
    expect(manager.isLoggedIn()).toBe(false);
    expect(manager.isLoading()).toBe(false);
  });

  it('derives isAdmin from the role of the user', () => {
    expect(manager.isAdmin()).toBe(false);

    state.user.set(sampleUser({ role: 'admin' }));
    expect(manager.isAdmin()).toBe(true);

    state.user.set(sampleUser({ role: 'contributor' }));
    expect(manager.isAdmin()).toBe(false);
  });

  it('reports no admin once the user is gone', () => {
    state.user.set(sampleUser({ role: 'admin' }));
    expect(manager.isAdmin()).toBe(true);

    state.user.set(null);
    expect(manager.isAdmin()).toBe(false);
  });
});
