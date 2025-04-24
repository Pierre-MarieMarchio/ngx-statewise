import { SingleAction, ValuePayloadFn } from "../../interfaces/action-type";
import { emptyPayload } from "../../utils/action.utils";

export class ActionCreatorFactory {
  public static defineActionCreator<T extends string, P>(
    type: T,
    payloadFn: SingleAction<P>
  ): any {
    let fn: any;
    if (payloadFn === emptyPayload) {
      fn = () => this.createAction(type);
    } else {
      fn = (payload: P) =>
        this.createAction(type, (payloadFn as ValuePayloadFn<P>)(payload));
    }
    fn.type = type;
    return fn;
  }

  private static createAction<T extends string>(type: T): { type: T };
  private static createAction<T extends string, P>(
    type: T,
    payload: P
  ): { type: T; payload: P };
  private static createAction<T extends string, P>(
    type: T,
    payload?: P
  ): { type: T; payload?: P } {
    return payload === undefined ? { type } : { type, payload };
  }
}
