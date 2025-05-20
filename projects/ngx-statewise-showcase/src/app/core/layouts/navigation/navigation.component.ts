import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { NavigationItem } from '@app/core/interfaces';
import { AuthManager } from '@app/features/auth/managers/auth-manager';
import { DarkModeComponent } from '@shared/dark-mode/dark-mode.component';
import { MatButtonModule } from '@angular/material/button';

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
  private readonly authManager = inject(AuthManager);

  public logedInDisplay = this.authManager.isLoggedIn;

  public handleLogout(): void {
    console.log('logout');
    this.authManager.logout();
  }

  public navigationItem: NavigationItem[] = [
    {
      icon: 'home',
      label: 'Home',
      route: 'home',
    },
    {
      icon: 'List_Alt',
      label: 'Todo',
      route: 'test1',
    },
    {
      icon: 'Calendar_Month',
      label: 'Calendar',
      route: 'test2',
    },
  ];
}
