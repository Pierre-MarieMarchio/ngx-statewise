import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { AUTH_MANAGER } from '@shared/app-common/tokens';

@Component({
  selector: 'app-dashboard-user-picker',
  imports: [MatButtonToggleModule],
  templateUrl: './dashboard-user-picker.component.html',
  styleUrl: './dashboard-user-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardUserPickerComponent {
  private readonly authManager = inject(AUTH_MANAGER);

  public onSelectionChange(event: MatButtonToggleChange): void {
    const selectedValue = event.value;
    const userCredentials = {
      'admin': { email: 'admin@admin', password: 'admin' },
      'user1': { email: 'user1@user', password: 'user1' },
      'user2': { email: 'user2@user', password: 'user2' },
    };

    const credentials =
      userCredentials[selectedValue as keyof typeof userCredentials];
    if (credentials) {
      this.authManager.login(credentials);
    }
  }


  public getCurrentUserEmail(): string {

    console.log(this.authManager.user()?.userName);
    
    return this.authManager.user()?.userName ?? '';
  }
}
