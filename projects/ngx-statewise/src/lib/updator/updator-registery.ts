import { IUpdator } from './updator-interfaces';


const globalUpdatorRegistry = new Map<string, IUpdator<any>>();

/**
 * Enregistre un `updator` pour une seule action.
 */
export function registerUpdator<S>(
  actionType: string,
  updator: IUpdator<S>
): void {
  globalUpdatorRegistry.set(actionType, updator);
}

/**
 * Enregistre un `updator` pour toutes les actions qu’il gère.
 */
export function registerFullUpdator<S>(updator: IUpdator<S>): void {
  Object.keys(updator.updators).forEach((actionType) => {
    registerUpdator(actionType, updator);
  });
}

/**
 * Récupère l’`updator` correspondant à un type d’action.
 */
export function getUpdator<S>(actionType: string): IUpdator<S> | undefined {
  return globalUpdatorRegistry.get(actionType);
}
