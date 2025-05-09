import { Observable } from 'rxjs';
import { Action } from '../../action/interfaces/action-type';

export type SWEffects =
  | Promise<Observable<Action> | Action | Action[] | void>
  | Observable<Action | Action[]>
  | Action
  | Action[]
  | void;
