import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { NavigationItem } from '@app/core/interfaces';
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

  public logedInDisplay = this.authManager.isLoggedIn;

  public handleLogout(): void {
    console.log('logout');
    this.authManager.logout();
  }

  public navigationItem: NavigationItem[] = [
    {
      icon: 'Dashboard',
      label: 'Dashboard',
      route: 'home',
    },
    {
      icon: 'Task_Alt',
      label: 'Task',
      route: 'test1',
    },
    {
      icon: 'Folder_Open',
      label: 'Project',
      route: 'test2',
    },
    {
      icon: 'Group',
      label: 'Team',
      route: 'test3',
    },
  ];
}
