import { Injectable } from '@angular/core';

/**
 * Plain properties, no signal in sight: an updater reads its state from the
 * injector and mutates it, and nothing in the library requires that state to
 * be reactive. What a signal buys is the view refreshing on its own — a
 * template over these fields only redraws when change detection runs for
 * another reason.
 */
@Injectable({
  providedIn: 'root',
})
export class TallyState {
  public total = 0;
  public lastStep = 0;
}
