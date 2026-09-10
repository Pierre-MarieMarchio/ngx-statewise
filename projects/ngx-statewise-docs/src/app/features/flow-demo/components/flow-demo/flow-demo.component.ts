import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { LOCALE, uiStrings } from '../../../../core/i18n';
import { FlowDemoManager } from '../../states/flow-demo/flow-demo.manager';

/**
 * The landing page's diagram, with the library running underneath it. Its own
 * component rather than part of the page: it owns a fair amount of markup and
 * style, and the page around it should not have to carry either.
 */
@Component({
  selector: 'docs-flow-demo',
  templateUrl: './flow-demo.component.html',
  styleUrl: './flow-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowDemoComponent {
  protected readonly locale = inject(LOCALE);
  protected readonly demo = inject(FlowDemoManager);

  protected readonly text = computed(() => uiStrings(this.locale.code));

  /** What the live region says, so the run is not a purely visual event. */
  protected readonly status = computed(() => {
    const text = this.text();

    switch (this.demo.phase()) {
      case 'pending':
        return text.demoStatusRunning;
      case 'done':
        return text.demoStatusDone;
      default:
        return text.demoStatusIdle;
    }
  });
}
