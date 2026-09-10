/**
 * What one feature may know of the signed-in user, and no more.
 *
 * The whole `User`, with its name, email and organisation, belongs to
 * `features/auth/models`. Only these two fields are ever read outside auth:
 * `userId` to scope a request, `role` to decide what a list shows.
 */
export interface SessionUser {
  readonly userId: string;
  readonly role: string;
}
