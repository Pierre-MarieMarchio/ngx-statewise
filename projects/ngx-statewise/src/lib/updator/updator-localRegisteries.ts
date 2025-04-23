import { IUpdator } from "./updator-interfaces";

const localRegistries = new WeakMap<object, Set<IUpdator<any>>>();


export function registerLocalUpdator<S>(
  manager: object,
  updator: IUpdator<S>
): void {

  if (!localRegistries.has(manager)) {
    localRegistries.set(manager, new Set());
  }

  const localRegistry = localRegistries.get(manager)!;
  localRegistry.add(updator);
}


export function getLocalUpdator<S>(
  manager: object,
  actionType: string
): IUpdator<S> | undefined {
  const localRegistry = localRegistries.get(manager);
  if (!localRegistry) return undefined;

  for (const updator of localRegistry) {
    if (updator.updators[actionType]) {
      return updator as IUpdator<S>;
    }
  }

  return undefined;
}
