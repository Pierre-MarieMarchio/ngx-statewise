import { Injectable } from "@angular/core";
import { isObservable, firstValueFrom } from "rxjs";
import { Action } from "../../action/action-type";
import { SWEffects } from "../interfaces/SWEffects.types";

@Injectable({ providedIn: 'root' })
export class EffectResultResolver {
  public async resolve(result: SWEffects): Promise<(Action | void)[]> {
    if (result === undefined || result === null) {
      return [undefined];
    } else if (result instanceof Promise) {
      const awaited = await result;

      if (isObservable(awaited)) {
        const resolvedObs = await firstValueFrom(awaited);
        return Array.isArray(resolvedObs) ? resolvedObs : [resolvedObs];
      }

      return Array.isArray(awaited) ? awaited.flat() : [awaited];
    } else if (isObservable(result)) {
      const resolved = await firstValueFrom(result);
      return Array.isArray(resolved) ? resolved : [resolved];
    } else if (Array.isArray(result)) {
      return result;
    } else {
      return [result];
    }
  }
}
