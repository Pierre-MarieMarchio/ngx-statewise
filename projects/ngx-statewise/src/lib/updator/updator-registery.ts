import { UpdatorRegistry, Updator } from './updator-interfaces';

export function createHandlerRegistry<S>(): UpdatorRegistry<S> {
  return {};
}

export function UpdatorHandler<S, P = any>(
  registry: UpdatorRegistry<S>,
  actionType: string,
  handler: Updator<S, P>
): UpdatorRegistry<S> {
  return {
    ...registry,
    [actionType]: handler,
  };
}
