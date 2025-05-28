import { Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { DarkModeComponent } from '@shared/reusable/dark-mode/dark-mode.component';
import { MatButtonModule } from '@angular/material/button';
import { AUTH_MANAGER } from '@shared/app-common/tokens';
import { NavigationItem } from '@app/core/models';

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
  public readonly navigationitems = input<NavigationItem[]>();

  public logedInDisplay = this.authManager.isLoggedIn;

  public handleLogout(): void {
    this.authManager.logout();
  }
}
