import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { Action } from "../../action/action-type";
import { EffectPromiseHandler } from "../handlers/effect-promise.handler";
import { SWEffects } from "../interfaces/SWEffects.types";

@Injectable({ providedIn: 'root' })
export class EffectService {
  private readonly effectPromiseHandler = inject(EffectPromiseHandler);

  public createEffectPromise(
    handler: (payload?: any) => SWEffects | Observable<any>,
    action: Action,
    actionType: string
  ): Promise<void> {
    return this.effectPromiseHandler.createPromise(handler, action, actionType);
  }
}
