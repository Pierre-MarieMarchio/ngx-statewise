import { Action } from '../../action/action-type';
import { EffectManager } from '../../effect/effect-manager';
import { IUpdator } from '../../updator/updator-interfaces';
import {
  registerLocalUpdator,
  getLocalUpdator,
} from '../../updator/updator-localRegisteries';
import { StateStore } from '../manager-store';
import { UpdatorGlobalRegistry } from '../../updator/updator-globalRegistery';
import { ActionDispatcher } from '../../action/action-dispatcher';

export class DispatchAsyncHandler {
  private readonly store = StateStore.getInstance();
  private readonly dispatcher = ActionDispatcher.getInstance(); // direct
  private readonly effects = EffectManager.getInstance();
  private readonly globalRegistery = UpdatorGlobalRegistry.getInstance();

  public handle<T extends Action, S>(
    action: T,
    contextOrUpdator?: object | IUpdator<S>
  ): Promise<void> {
    this.setContext(action.type, contextOrUpdator);

    const explicit = this.asUpdator(contextOrUpdator);
    if (explicit) {
      registerLocalUpdator(explicit, explicit);
      return this.execWithCleanup(
        this.store.dispatshAsync(action, explicit),
        action.type
      );
    }

    const local = this.asLocal(contextOrUpdator, action.type);
    if (local) {
      return this.execWithCleanup(
        this.store.dispatshAsync(action, local),
        action.type
      );
    }

    const globalUpd = this.globalRegistery.getUpdator<S>(action.type);
    if (globalUpd) {
      return this.execWithCleanup(
        this.store.dispatshAsync(action, globalUpd),
        action.type
      );
    }

    this.dispatcher.emit(action);
    return this.execWithCleanup(this.effects.waitFor(action.type), action.type);
  }

  private setContext(type: string, context?: object | IUpdator<any>) {
    if (context) this.effects.setContextForAction(type, context);
  }

  private asUpdator<S>(updator?: object | IUpdator<S>): IUpdator<S> | null {
    return updator && 'state' in updator && 'updators' in updator
      ? updator
      : null;
  }

  private asLocal<S>(
    context: object | IUpdator<S> | undefined,
    type: string
  ): IUpdator<S> | null {
    return context && !this.asUpdator(context)
      ? getLocalUpdator(context as object, type) || null
      : null;
  }

  private async execWithCleanup(
    promise: Promise<void>,
    type: string
  ): Promise<void> {
    try {
      return await promise;
    } finally {
      this.effects.clearContext(type);
    }
  }
}
