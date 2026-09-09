import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NoticeState {
  public message = signal<string | null>(null);
  public raisedCount = signal(0);
}
