import type { Action } from '../action';
import type { EffectOutcome } from './effect-outcome';

/** An effect as the registry stores it, already bound to its payload read. */
export type RegisteredEffect = (action: Action) => EffectOutcome;
