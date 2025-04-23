import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { Action } from "../../action/action-type";
import { SWEffects } from "../interfaces/SWEffects.types";
import { EffectResultResolver } from "./effect-result.resolver";
import { EffectResultHandler } from "./effect-result.handler";

@Injectable({ providedIn: 'root' })
export class EffectPromiseHandler {
  private readonly effectResultResolver = inject(EffectResultResolver);
  private readonly effectResultHandler = inject(EffectResultHandler);

  public createPromise(
    handler: (payload?: any) => SWEffects | Observable<any>,
    action: Action,
    actionType: string
  ): Promise<void> {
    return (async () => {
      try {
        const rawResult = handler(action.payload);
        const results = await this.effectResultResolver.resolve(rawResult);
        console.log('createEffectPromise:', results, actionType);

        const subActionPromises = await this.effectResultHandler.handle(
          results,
          actionType
        );

        if (subActionPromises.length > 0) {
          await Promise.all(subActionPromises);
        }
      } catch (error) {
        console.error(`Effect for ${actionType} failed:`, error);
      }
    })();
  }
}
