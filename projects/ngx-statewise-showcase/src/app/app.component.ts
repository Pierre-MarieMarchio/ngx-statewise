import {
  Component,
  effect,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeService } from './shared/reusable/dark-mode/theme.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavigationComponent } from './core/layouts';
import { navigationItems } from './config/navigation.configuration';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent, MatProgressBarModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public readonly title = 'Ngx-statewise';
  private readonly themeService = inject(ThemeService);
  public readonly navigationItems = navigationItems;

  constructor() {
    effect(() => {
      const theme = this.themeService.themeSignal();
      document.body.className = `${theme} mat-typography`;
    });
  }
}
