import { defineSingleAction } from './define-actions';
import { ofType } from './of-type';
import { emptyPayload } from './payload';
import type { Equal, Expect } from '../../spec-helpers/type-assertion';

describe('ofType', () => {
  const logout = defineSingleAction('LOGOUT', emptyPayload);

  it('reads the type name of a creator and of an action', () => {
    const fromCreator = ofType(logout);
    const fromAction = ofType(logout());

    expect(fromCreator).toBe('LOGOUT_ACTION');
    expect(fromAction).toBe('LOGOUT_ACTION');
  });

  it('keeps the literal type in both cases', () => {
    const fromCreator = ofType(logout);
    const fromAction = ofType(logout());

    type _FromCreator = Expect<Equal<typeof fromCreator, 'LOGOUT_ACTION'>>;
    type _FromAction = Expect<Equal<typeof fromAction, 'LOGOUT_ACTION'>>;

    expect(fromCreator).toBe(fromAction);
  });
});
