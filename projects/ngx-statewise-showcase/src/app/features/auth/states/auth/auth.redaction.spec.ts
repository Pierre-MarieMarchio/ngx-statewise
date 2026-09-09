import { withoutCredentials } from './auth.redaction';
import { loginActions } from './auth.action';

describe('withoutCredentials', () => {
  it('replaces the password of a login request', () => {
    const redacted = withoutCredentials(
      loginActions.request({ email: 'admin@admin', password: 'admin' }),
    );

    expect(redacted).toEqual({
      type: loginActions.request.type,
      payload: { email: 'admin@admin', password: '[redacted]' },
    });
  });

  it('leaves the dispatched action untouched', () => {
    const dispatched = loginActions.request({
      email: 'admin@admin',
      password: 'admin',
    });

    withoutCredentials(dispatched);

    expect(dispatched.payload.password).toBe('admin');
  });

  it('hands back any other action as it is', () => {
    const other = loginActions.failure();

    expect(withoutCredentials(other)).toBe(other);
  });
});
