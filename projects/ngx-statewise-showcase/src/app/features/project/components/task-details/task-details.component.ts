import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
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
import { TEAM_DIRECTORY } from '../../ports';
import { TaskPresentationService } from '../../services';
import { ProjectManager } from '../../states/project/project.manager';

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

  /**
   * Whether this caller offers editing. The dashboard's panel reads, the
   * board's writes — and a button that emits into nothing is worse than no
   * button at all.
   */
  public readonly editable = input(false);

  public readonly closed = output<void>();
  public readonly editRequested = output<void>();

  public readonly presentation = inject(TaskPresentationService);

  /** Names for the assignees, which this feature cannot look up on its own. */
  public readonly directory = inject(TEAM_DIRECTORY);

  private readonly projectManager = inject(ProjectManager);

  /**
   * The project's title, and its id when the projects have not arrived — the
   * panel showed the raw id either way until now, in a field labelled
   * "Project" that no reader could match to anything on screen.
   */
  public readonly projectName = computed(() => {
    const projectId = this.selectedTask()?.projectId;

    if (!projectId) {
      return '';
    }

    return (
      this.projectManager.projects().find((project) => project.id === projectId)
        ?.title ?? projectId
    );
  });

  public onCloseClick(): void {
    this.closed.emit();
  }

  public onEditClick(): void {
    this.editRequested.emit();
  }
}
