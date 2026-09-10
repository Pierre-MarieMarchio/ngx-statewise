import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ThemeToggleComponent } from '@shared/ui/theme-toggle';
import { NavigationItem } from './navigation-item.model';

/**
 * The application's navigation rail.
 *
 * It knows nothing about who is signed in. The session state arrives as an
 * input and the request to leave goes out as an output, which is what lets a
 * shared component stay out of a feature: whoever composes the shell owns the
 * auth wiring.
 *
 * It draws its own links rather than taking Material's list: the rail stacks
 * an icon over a label and marks the active one with a rule down its left
 * edge, none of which a `mat-list-item` lays out. The anchors used to carry a
 * `mat-item` attribute matching no selector at all, so nothing applied and the
 * `matListItemIcon` beside it sat outside any list item.
 */
@Component({
  selector: 'app-nav-shell',
  imports: [
    ThemeToggleComponent,
    MatIconModule,
    NgTemplateOutlet,
    RouterModule,
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
