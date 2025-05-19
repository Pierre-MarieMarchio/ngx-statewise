import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { NavigationItem } from '@app/core/interfaces';
import { DarkModeComponent } from '@shared/dark-mode/dark-mode.component';

@Component({
  selector: 'app-navigation',
  imports: [MatListModule, DarkModeComponent, MatIconModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  public navigationItem: NavigationItem[] = [
    {
      icon: 'home',
      label: 'home',
      route: 'home',
    },
    {
      icon: 'home',
      label: 'test 1',
      route: 'test1',
    },
    {
      icon: 'home',
      label: 'test 2',
      route: 'test2',
    },
  ];
}
