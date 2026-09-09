import {
  defineActionsGroup,
  defineSingleAction,
  emptyPayload,
  payload,
} from 'ngx-statewise';

/** What the pretend API hands back. Two fields is enough to watch it land. */
export interface DemoSession {
  readonly user: string;
}

/**
 * The login flow the landing page plays. Deliberately the same one the guide
 * uses in its examples, so the diagram, the code beside it and the pages it
 * links to are all describing one thing.
 */
export const demoLoginActions = defineActionsGroup({
  source: 'DEMO_LOGIN',
  events: {
    /** Dispatched by the button. Nothing happens until this one is sent. */
    request: emptyPayload,
    /** Returned by the effect once the pretend request comes back. */
    success: payload<DemoSession>(),
  },
});

/** Puts the demo back where it started, so it can be played again. */
export const demoResetAction = defineSingleAction('DEMO_RESET', emptyPayload);
