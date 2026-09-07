import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { Action } from '../../action/interfaces/action-type';
import type { SWEffects } from '../interfaces/SWEffects.types';
import { EffectResultResolver } from './resolvers/effect-result.resolver';
import { EffectResultHandler } from './handlers/effect-result.handler';
import type { DispatchExecution } from '../../manager/interfaces/dispatch-execution';

@Injectable({ providedIn: 'root' })
export class EffectPromiseService {
  private readonly effectResultResolver = inject(EffectResultResolver);
  private readonly effectResultHandler = inject(EffectResultHandler);

  public async createPromise(
    handler: (payload?: any) => SWEffects | Observable<any>,
    action: Action,
    execution: DispatchExecution
  ): Promise<void> {
    const rawResult = handler(action.payload);
    const results = await this.effectResultResolver.resolve(rawResult);
    await this.effectResultHandler.handle(results, execution);
  }
}
