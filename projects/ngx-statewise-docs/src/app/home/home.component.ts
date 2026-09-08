import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GUIDE_SECTIONS } from '../guide/guide-pages';
import { REPOSITORY_URL } from '../site';

@Component({
  selector: 'docs-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly sections = GUIDE_SECTIONS;
  protected readonly repositoryUrl = REPOSITORY_URL;
}
