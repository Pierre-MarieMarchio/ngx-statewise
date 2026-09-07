import { defineSingleAction, emptyPayload } from '../action';
import {
  declareUpdaterActionTypes,
  isUpdaterActionTypeDeclared,
  restoreUpdaterActionTypes,
  snapshotUpdaterActionTypes,
} from './declared-action-types';
import { defineUpdater } from './define-updater';

describe('updater action-type declarations', () => {
  let restore: () => void;

  beforeEach(() => {
    const snapshot = snapshotUpdaterActionTypes();
    restore = (): void => {
      restoreUpdaterActionTypes(snapshot);
    };
  });

  afterEach(() => {
    restore();
  });

  it('reports an unknown type as undeclared', () => {
    expect(isUpdaterActionTypeDeclared('DECLARED_NEVER_SEEN')).toBeFalse();
  });

  it('records every type it is given', () => {
    declareUpdaterActionTypes(['DECLARED_A', 'DECLARED_B']);

    expect(isUpdaterActionTypeDeclared('DECLARED_A')).toBeTrue();
    expect(isUpdaterActionTypeDeclared('DECLARED_B')).toBeTrue();
  });

  it('accepts the same type twice without duplicating it', () => {
    declareUpdaterActionTypes(['DECLARED_TWICE']);
    declareUpdaterActionTypes(['DECLARED_TWICE']);

    const recorded = snapshotUpdaterActionTypes().filter(
      (type) => type === 'DECLARED_TWICE',
    );

    expect(recorded.length).toBe(1);
  });

  it('restores exactly the snapshotted declarations', () => {
    declareUpdaterActionTypes(['DECLARED_KEPT']);
    const snapshot = snapshotUpdaterActionTypes();

    declareUpdaterActionTypes(['DECLARED_TRANSIENT']);
    restoreUpdaterActionTypes(snapshot);

    expect(isUpdaterActionTypeDeclared('DECLARED_KEPT')).toBeTrue();
    expect(isUpdaterActionTypeDeclared('DECLARED_TRANSIENT')).toBeFalse();
  });

  it('is fed by defineUpdater as soon as the updater is declared', () => {
    const action = defineSingleAction('DECLARED_BY_DEFINE', emptyPayload);

    expect(isUpdaterActionTypeDeclared(action.type)).toBeFalse();

    defineUpdater({} as never, (on) => {
      on(action, () => undefined);
    });

    expect(isUpdaterActionTypeDeclared(action.type)).toBeTrue();
  });
});
