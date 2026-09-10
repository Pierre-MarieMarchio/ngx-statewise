import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { LOCALE, uiStrings } from '../../../../core/i18n';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import {
  buildSearchIndex,
  searchIndex,
  type SearchEntry,
} from '../../../../features/guide/search-index';

/**
 * A command palette over the guide. The whole corpus is already in the bundle,
 * so this needs no request, no service and no index to ship, which is the one
 * affordance a README cannot have at all.
 *
 * Uses a native `<dialog>`: focus trapping, the backdrop and Escape come with
 * it rather than being reimplemented.
 */
@Component({
  selector: 'docs-search-dialog',
  imports: [IconComponent],
  templateUrl: './search-dialog.component.html',
  styleUrl: './search-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDialogComponent {
  private readonly locale = inject(LOCALE);
  private readonly router = inject(Router);

  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  protected readonly text = computed(() => uiStrings(this.locale.code));
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  private readonly index = computed(() => buildSearchIndex(this.locale.code));

  protected readonly results = computed(() =>
    searchIndex(this.index(), this.query()),
  );

  public open(): void {
    this.query.set('');
    this.activeIndex.set(0);

    const element = this.dialog().nativeElement;

    // `showModal` is missing in jsdom, and in a browser old enough to lack
    // <dialog>. The open attribute still shows the palette; only the backdrop
    // and the focus trap are lost.
    if (typeof element.showModal === 'function') {
      element.showModal();
    } else {
      element.setAttribute('open', '');
    }

    this.field()?.nativeElement.focus();
  }

  protected close(): void {
    const element = this.dialog().nativeElement;

    if (typeof element.close === 'function') {
      element.close();
    } else {
      element.removeAttribute('open');
    }
  }

  protected onQuery(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const results = this.results();

    if (results.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((index) => (index + 1) % results.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update(
        (index) => (index - 1 + results.length) % results.length,
      );
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const target = results[this.activeIndex()];

      if (target !== undefined) {
        this.go(target);
      }
    }
  }

  protected go(entry: SearchEntry): void {
    this.close();
    void this.router.navigate(['/', this.locale.code, 'guide', entry.slug], {
      fragment: entry.fragment,
    });
  }

  /** Closing on a backdrop click: the dialog itself is the backdrop. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }

  /**
   * The keyboard's way out, and the same dismissal the backdrop click is.
   * `showModal` answers Escape on its own; the fallback in `open` above only
   * sets the open attribute, and there nothing would close the palette without
   * a pointer.
   */
  protected onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }
}
