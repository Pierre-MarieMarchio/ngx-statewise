import {
  SingleAction,
  EmptyPayloadFn,
  CamelToSnakeCase,
} from '../../interfaces/action-type';
import { toScreamingSnakeCase } from '../../utils/action.utils';
import { ActionCreatorFactory } from '../factories/action.factory';

export class ActionGroupHandler {

  public static handle<
    Source extends string,
    Events extends Record<string, SingleAction<any>>
  >(config: {
    source: Source;
    events: Events;
  }): {
    [K in keyof Events]: Events[K] extends EmptyPayloadFn
      ? () => {
          type: `${Uppercase<Source>}_${Uppercase<
            CamelToSnakeCase<string & K>
          >}`;
        }
      : (payload: Parameters<Events[K]>[0]) => {
          type: `${Uppercase<Source>}_${Uppercase<
            CamelToSnakeCase<string & K>
          >}`;
          payload: Parameters<Events[K]>[0];
        };
  } {
    const { source, events } = config;
    const result = {} as any;
    for (const key in events) {
      const type = `${source.toUpperCase()}_${toScreamingSnakeCase(key)}`;
      result[key] = ActionCreatorFactory.defineActionCreator(type, events[key]);
    }
    return result;
  }
}
