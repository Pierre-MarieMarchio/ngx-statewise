import { Signal } from '@angular/core';

/**
 * One member of the organisation, as this feature needs them.
 *
 * Two fields, and neither is `email` or `role`: a task names an assignee, and
 * what a task needs of a person is an id to store and a name to show. Whoever
 * answers this port knows far more; nothing here has to.
 */
export interface TeamMember {
  readonly id: string;
  readonly name: string;
}

/**
 * Who a task may be assigned to, and what their name is.
 *
 * The names belong to `features/auth`, and no feature imports another, so the
 * need is declared here, by the feature that has it, and answered outside both
 * of them. It is not in `features/common`: that kernel admits a port only when
 * two features consume it, and this one has a single consumer.
 */
export interface ITeamDirectory {
  /** The organisation's members, for a field that has to offer a choice. */
  readonly members: Signal<readonly TeamMember[]>;

  /**
   * The name behind an id, and the id itself when nobody answers to it, so a
   * directory that has not arrived yet shows something rather than nothing.
   */
  nameOf(userId: string): string;
}
