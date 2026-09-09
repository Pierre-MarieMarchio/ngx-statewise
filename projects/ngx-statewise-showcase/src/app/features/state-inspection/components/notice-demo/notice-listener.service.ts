import { computed, Injectable, signal } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { noticeActions } from '../../states/notice/notice.action';

/**
 * Counts the notices raised anywhere, for as long as it is listening.
 *
 * Provided by a component rather than at the root, so `createEffect` runs in
 * that component's injection context and the effect is unregistered when the
 * component is destroyed. Nothing has to remember to clean it up.
 *
 * The handle `createEffect` hands back is what stops it earlier than that,
 * which is the rarer case the library keeps `EffectRef` for.
 */
@Injectable()
export class NoticeListenerService {
  private readonly heard = signal(0);
  private readonly stopped = signal(false);

  public readonly heardCount = this.heard.asReadonly();
  public readonly isListening = computed(() => !this.stopped());

  private readonly listening = createEffect(noticeActions.raised, () => {
    this.heard.update((count) => count + 1);
  });

  public stopListening(): void {
    this.listening.destroy();
    this.stopped.set(true);
  }
}
