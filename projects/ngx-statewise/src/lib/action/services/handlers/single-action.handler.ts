import { Injectable } from '@angular/core';
import { SingleAction } from '../../interfaces/action-type';
import { ActionCreatorFactory } from '../factories/action.factory';

@Injectable({ providedIn: 'root' })
export class SingleActionHandler {

  public static handle<Source extends string, ActionPayload>(
    source: Source,
    payload: SingleAction<ActionPayload>
  ): {
    action: ActionPayload extends undefined
      ? () => { type: `${Source}_ACTION` }
      : (payload: ActionPayload) => {
          type: `${Source}_ACTION`;
          payload: ActionPayload;
        };
  } {
    return {
      action: ActionCreatorFactory.defineActionCreator(
        `${source}_ACTION`,
        payload
      ),
    } as any;
  }
}
