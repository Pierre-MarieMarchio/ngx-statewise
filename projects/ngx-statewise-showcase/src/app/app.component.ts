import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService, } from './shared/dark-mode/theme.service';
import { NavigationComponent } from "./core/layouts/navigation/navigation.component";



@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, NavigationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Todo-App';
  public readonly themeService = inject(ThemeService);
}
