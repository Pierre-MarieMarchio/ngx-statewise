import {
  Observable,
  mergeMap,
  tap,
  catchError,
  EMPTY,
  shareReplay,
} from 'rxjs';
import { Action } from '../action';
import { EffectHandler } from './effect-handler';

export function createEffect<P>(
  actionT: string,
  handler: (payload: P) => Observable<Action>
): Observable<Action> {
  const effectHandler = EffectHandler.getInstance();

  // Créer l'Observable
  const effect$ = effectHandler.ofType(actionT).pipe(
    mergeMap((action) => {
      console.log(
        `Effect for ${actionT} triggered with payload:`,
        action.payload
      );
      return handler(action.payload).pipe(
        tap((resultAction) => {
          console.log('Effect emitting result action:', resultAction.type);
          effectHandler.emit(resultAction);
        })
      );
    }),
    catchError((error) => {
      console.error(`Effect for ${actionT} failed:`, error);
      return EMPTY;
    }),
    shareReplay({
      bufferSize: 1,
      refCount: true,
    })
  );

  // Souscrire immédiatement pour activer l'effet
  effect$.subscribe();

  // Retourner l'Observable pour qu'il puisse être utilisé ailleurs si nécessaire
  return effect$;
}
