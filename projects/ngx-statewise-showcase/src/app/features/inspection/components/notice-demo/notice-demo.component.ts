import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { injectStatewise } from 'ngx-statewise';
import { projectUpdater } from '@app/features/project/states/project/project.updater';
import { NoticeState } from '../../states/notice/notice.state';
import { noticeActions } from '../../states/notice/notice.action';
import { NoticeListenerService } from './notice-listener.service';

/**
 * Two dispatch handles, neither owning the notice updater: one owning no
 * updater at all, one owning an unrelated manager's updater. Both reach the
 * globally registered notice updater, which is the whole point of registering
 * an updater through `provideStatewise` instead of a manager.
 *
 * It also provides its own listener, so that effect lives and dies with this
 * component instead of with the application.
 */
@Component({
  selector: 'app-notice-demo',
  imports: [MatButtonModule],
  templateUrl: './notice-demo.component.html',
  styleUrl: './notice-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NoticeListenerService],
})
export class NoticeDemoComponent {
  public readonly noticeState = inject(NoticeState);
  public readonly listener = inject(NoticeListenerService);

  private readonly bareHandle = injectStatewise();
  private readonly unrelatedHandle = injectStatewise(projectUpdater);

  public raiseFromBareHandle(): void {
    this.bareHandle.dispatch(
      noticeActions.raised('raised from a handle owning no updater'),
    );
  }

  public raiseFromUnrelatedHandle(): void {
    this.unrelatedHandle.dispatch(
      noticeActions.raised('raised from a handle owning the project updater'),
    );
  }

  public clear(): void {
    this.bareHandle.dispatch(noticeActions.cleared());
  }
}
