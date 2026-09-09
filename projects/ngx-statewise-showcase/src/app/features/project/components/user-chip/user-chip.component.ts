import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { ChipComponent } from '@shared/ui/chip';
import { TEAM_DIRECTORY } from '../../ports';

/**
 * A person, by name.
 *
 * No tint: who a task belongs to is not a scale, and giving people colours
 * would put a third meaning on hues that already carry two.
 */
@Component({
  selector: 'app-user-chip',
  imports: [ChipComponent],
  template: `
    <app-chip
      icon="person"
      [label]="directory.nameOf(userId())"
      tint="var(--mat-sys-surface-variant)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserChipComponent {
  public readonly userId = input.required<string>();

  public readonly directory = inject(TEAM_DIRECTORY);
}
