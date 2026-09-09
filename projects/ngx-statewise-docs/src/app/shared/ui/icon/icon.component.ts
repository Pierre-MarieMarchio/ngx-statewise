import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'menu'
  | 'close'
  | 'dark-mode'
  | 'light-mode'
  | 'translate'
  | 'chevron-left'
  | 'chevron-right'
  | 'edit'
  | 'info'
  | 'search'
  | 'system-theme'
  | 'check';

/**
 * The handful of icons this site uses, traced in the Material Symbols outlined
 * style so it looks like the showcase without carrying the 3.8 MB variable
 * icon font the showcase needs for naming icons at runtime.
 */
@Component({
  selector: 'docs-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  public readonly name = input.required<IconName>();
}
