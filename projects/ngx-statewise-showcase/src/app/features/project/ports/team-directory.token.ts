import { InjectionToken } from '@angular/core';
import { ITeamDirectory } from './team-directory.port';

/**
 * Deliberately without a factory default. One that resolved every name to its
 * id would let a composition forget the provider and show UUIDs in silence,
 * which is the bug this port exists to fix.
 */
export const TEAM_DIRECTORY = new InjectionToken<ITeamDirectory>(
  'TEAM_DIRECTORY',
);
