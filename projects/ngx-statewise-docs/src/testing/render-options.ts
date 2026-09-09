import type { CalloutLabels } from '../app/features/guide/callout';
import type { RenderGuideOptions } from '../app/features/guide/markdown';

export const TEST_CALLOUT_LABELS: CalloutLabels = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Careful',
};

/** Render options for a spec, with `toExternalUrl` as the identity by default. */
export function renderOptions(
  overrides: Partial<RenderGuideOptions> = {},
): RenderGuideOptions {
  return {
    toExternalUrl: (path) => path,
    copyCodeLabel: 'Copy code',
    headingLinkLabel: 'On this page',
    calloutLabels: TEST_CALLOUT_LABELS,
    codeRegionLabel: 'Code sample',
    tableRegionLabel: 'Table',
    preferLabel: 'Prefer',
    avoidLabel: 'Avoid',
    ...overrides,
  };
}
