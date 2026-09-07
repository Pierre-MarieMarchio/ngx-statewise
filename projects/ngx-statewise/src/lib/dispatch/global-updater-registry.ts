import { Injectable } from '@angular/core';

import type { StateBoundHandler } from '../updater/updater-definition';

/** The updaters declared through `provideStatewise`, visible to every scope. */
@Injectable()
export class GlobalUpdaterRegistry {
  private handlers: ReadonlyMap<string, StateBoundHandler> = new Map();

  public set(handlers: ReadonlyMap<string, StateBoundHandler>): void {
    this.handlers = handlers;
  }

  public get(actionType: string): StateBoundHandler | undefined {
    return this.handlers.get(actionType);
  }
}
