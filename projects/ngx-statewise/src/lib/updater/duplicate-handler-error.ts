/** One updater declaring the same action type twice. */
export function duplicateHandlerInUpdaterError(actionType: string): Error {
  return new Error(
    `[ngx-statewise] Duplicate handler for action type "${actionType}" in a ` +
      `single updater. Each action may be handled only once per updater.`,
  );
}

/** Two updaters of one dispatch scope claiming the same action type. */
export function conflictingUpdatersError(actionType: string): Error {
  return new Error(
    `[ngx-statewise] Two updaters attached to the same scope both handle ` +
      `"${actionType}". Split them across separate injectStatewise() scopes, ` +
      `or let a single updater own that action type.`,
  );
}
