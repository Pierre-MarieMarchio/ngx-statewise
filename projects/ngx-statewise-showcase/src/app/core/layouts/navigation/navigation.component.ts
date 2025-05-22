import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { navigationItems } from './navigationItems';
import { DarkModeComponent } from '@shared/dark-mode/dark-mode.component';
import { MatButtonModule } from '@angular/material/button';
import { AUTH_MANAGER } from '@shared/token-provider';


@Component({
  selector: 'app-navigation',
  imports: [
    MatListModule,
    DarkModeComponent,
    MatIconModule,
    RouterModule,
    MatButtonModule,
  ],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  private readonly authManager = inject(AUTH_MANAGER);
  public readonly navigationitems = navigationItems;

  public logedInDisplay = this.authManager.isLoggedIn;

  public handleLogout(): void {
    this.authManager.logout();
  }
}
