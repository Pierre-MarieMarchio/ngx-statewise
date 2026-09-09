import {
  Component,
  effect,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeService } from './shared/ui/theme-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavShellComponent } from './shared/ui/nav-shell';
import { navigationItems } from './config/navigation.configuration';
import { AuthManager } from './features/auth/states/auth/auth.manager';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavShellComponent, MatProgressBarModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public readonly title = 'Ngx-statewise';
  private readonly themeService = inject(ThemeService);
  public readonly navigationItems = navigationItems;

  /**
   * The shell composes the navigation rail with the session, which is why the
   * auth wiring lives here rather than inside a shared component.
   */
  public readonly auth = inject(AuthManager);

  constructor() {
    effect(() => {
      const theme = this.themeService.themeSignal();
      document.body.className = `${theme} mat-typography`;
    });
  }
}
