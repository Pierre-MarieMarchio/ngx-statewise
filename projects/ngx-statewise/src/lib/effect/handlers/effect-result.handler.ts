import { Injectable, inject } from "@angular/core";
import { ActionDispatcher } from "../../action/action-dispatcher";
import { Action } from "../../action/action-type";
import { DispatchHandler } from "../../manager/handlers/dispatch.handler";
import { GlobalUpdatorsRegistry } from "../../updator/registries/global-updators.registery";
import { LocalUpdatorRegistry } from "../../updator/registries/local-updators.registery";
import { ActionContextRegistery } from "../registries/action-context.registery";
import { EffectRelationRegistery } from "../registries/effect-relation.registery";
import { PendingEffectRegistry } from "../registries/pending-effect.registery";

@Injectable({ providedIn: 'root' })
export class EffectResultHandler {
  private readonly pendingEffectRegistry = inject(PendingEffectRegistry);
  private readonly actionContextRegistry = inject(ActionContextRegistery);
  private readonly effectRelationRegistry = inject(EffectRelationRegistery);
  private readonly globalUpdatorsRegistry = inject(GlobalUpdatorsRegistry);
  private readonly localUpdatorRegistry = inject(LocalUpdatorRegistry);
  private readonly dispatch = inject(DispatchHandler);

  public async handle(
    results: (Action | void)[],
    parentActionType: string
  ): Promise<Promise<void>[]> {
    const subActionPromises: Promise<void>[] = [];
    const context = this.actionContextRegistry.get(parentActionType);

    for (const result of results.flat().filter((a): a is Action => !!a)) {
      this.effectRelationRegistry.registerRelation(
        parentActionType,
        result.type
      );

      let used = this.tryUseLocalUpdator(result, context);

      if (!used) {
        used = this.tryUseGlobalUpdator(result);
      }

      if (!used) {
        ActionDispatcher.getInstance().emit(result);
      }

      this.collectPendingPromises(result, subActionPromises);
    }

    this.actionContextRegistry.clear(parentActionType);
    return subActionPromises;
  }

  private tryUseLocalUpdator(action: Action, context?: object): boolean {
    if (!context) return false;

    const local = this.localUpdatorRegistry.get(context, action.type);
    if (local) {
      this.dispatch.handle(action, context);
      return true;
    }

    return false;
  }

  private tryUseGlobalUpdator(action: Action): boolean {
    const globalUpdator = this.globalUpdatorsRegistry.getUpdator(action.type);
    if (globalUpdator) {
      this.dispatch.handle(action, globalUpdator);
      return true;
    }

    return false;
  }

  private collectPendingPromises(
    action: Action,
    subActionPromises: Promise<void>[]
  ): void {
    const pending = this.pendingEffectRegistry.getPending(action.type);
    if (pending.length) {
      subActionPromises.push(pending[0]);
    }
  }
}
