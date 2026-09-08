import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { UserSwitchService } from '@app/features/auth/services';
import { AUTH_MANAGER } from '@shared/app-common/tokens';

/**
 * The toggle values double as the demo user names, so the group can be bound
 * straight to the name the auth manager reports.
 */
const DEMO_CREDENTIALS = {
  admin: { email: 'admin@admin', password: 'admin' },
  user1: { email: 'user1@user', password: 'user1' },
  user2: { email: 'user2@user', password: 'user2' },
};

@Component({
  selector: 'app-dashboard-user-picker',
  imports: [MatButtonToggleModule],
  templateUrl: './dashboard-user-picker.component.html',
  styleUrl: './dashboard-user-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardUserPickerComponent {
  private readonly authManager = inject(AUTH_MANAGER);
  private readonly userSwitch = inject(UserSwitchService);

  public readonly currentUserName = computed(
    () => this.authManager.user()?.userName ?? '',
  );

  /** Disables the group while the new user's data is still on its way. */
  public readonly isSwitching = this.userSwitch.isSwitching;

  public onSelectionChange(event: MatButtonToggleChange): void {
    const credentials =
      DEMO_CREDENTIALS[event.value as keyof typeof DEMO_CREDENTIALS];

    if (credentials) {
      void this.userSwitch.switchTo(credentials);
    }
  }
}
