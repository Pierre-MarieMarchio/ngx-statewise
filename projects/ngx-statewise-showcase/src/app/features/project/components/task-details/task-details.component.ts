import {
  Component,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { Task } from '../../models';
import { TaskPresentationService } from '../../services';

@Component({
  selector: 'app-task-details',
  imports: [
    TitleCasePipe,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    MatTabsModule,
  ],
  templateUrl: './task-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './task-details.component.scss',
})
export class TaskDetailsComponent {
  public readonly selectedTask = input<Task | null>();
  public readonly closed = output<void>();

  public readonly presentation = inject(TaskPresentationService);

  public onCloseClick(): void {
    this.closed.emit();
  }
}
