import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthStatesService {
  public isRegister = signal<boolean>(true);
}
