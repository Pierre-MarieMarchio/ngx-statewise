import { computed, inject, Provider } from '@angular/core';
import { AuthManager } from '@app/features/auth/states';
import {
  ITeamDirectory,
  TEAM_DIRECTORY,
  TeamMember,
} from '@app/features/project/ports';

/**
 * Answers `features/project`'s directory port with `features/auth`'s members.
 *
 * It lives here because this is the only layer that may read both. The port is
 * declared by the feature that needs it, the names are owned by the feature
 * that has them, and neither imports the other — this file is the whole of the
 * join, and the dependency law is checked by lint on both sides of it.
 *
 * A file rather than a page: every page that renders a task needs the same
 * answer, so the composition is written once and wired where the shared
 * kernel's own ports are wired.
 */
export function provideTeamDirectory(): Provider {
  return {
    provide: TEAM_DIRECTORY,
    useFactory: (): ITeamDirectory => {
      const auth = inject(AuthManager);

      const members = computed<readonly TeamMember[]>(() =>
        auth.members().map((member) => ({
          id: member.userId,
          name: member.userName,
        })),
      );

      // A map rather than a `find` per call: a table asks once per row, and
      // the lookup is rebuilt only when the directory itself changes.
      const byId = computed(
        () => new Map(members().map((member) => [member.id, member.name])),
      );

      return {
        members,
        nameOf: (userId) => byId().get(userId) ?? userId,
      };
    },
  };
}
