import { Injectable, Signal, inject } from "@angular/core";
import { ActionEffectRegistry } from "../../registries/action-effect.registery";
import { PendingEffectRegistry } from "../../registries/pending-effect.registery";
import { Action } from "../interfaces/action-type";
import { ActionHistoryService } from "./action-history.service";
import { ActionEffectHandlerr } from "./handlers/action-effect.handler";

@Injectable({ providedIn: 'root' })
export class ActionDispatcherService {
  private readonly actionHistory = inject(ActionHistoryService);
  private readonly actionEffectHandler = inject(ActionEffectHandlerr);
  private readonly actionEffectRegistry = inject(ActionEffectRegistry);
  private readonly pendingEffectRegistry = inject(PendingEffectRegistry);

  private constructor() {}

  public emit(action: Action): void {
    if (!this.actionEffectRegistry.has(action.type)) {
      this.pendingEffectRegistry.register(action.type, Promise.resolve());
    }

    this.actionHistory.record(action);
    this.actionEffectHandler.handle(action);
  }

  public registerEffect(
    actionType: string,
    effect: (action: Action) => void
  ): void {
    this.actionEffectRegistry.register(actionType, effect);
  }

  public get latest(): Signal<Action | null> {
    return this.actionHistory.latest();
  }

  public get history(): Signal<Action[]> {
    return this.actionHistory.history();
  }
}
