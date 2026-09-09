import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { DarkModeComponent } from '@shared/reusable/dark-mode/dark-mode.component';
import { MatButtonModule } from '@angular/material/button';
import { NavigationItem } from './navigation-item.model';

/**
 * The application's navigation rail.
 *
 * It knows nothing about who is signed in. The session state arrives as an
 * input and the request to leave goes out as an output, which is what lets a
 * shared component stay out of a feature: whoever composes the shell owns the
 * auth wiring.
 */
@Component({
  selector: 'app-nav-shell',
  imports: [
    MatListModule,
    DarkModeComponent,
    MatIconModule,
    RouterModule,
    MatButtonModule,
  ],
  templateUrl: './nav-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './nav-shell.component.scss',
})
export class NavShellComponent {
  public readonly navigationItems = input<NavigationItem[]>();
  public readonly isLoggedIn = input.required<boolean>();

  public readonly logout = output<void>();
}
