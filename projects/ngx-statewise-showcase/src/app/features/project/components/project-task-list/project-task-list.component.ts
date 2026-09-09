import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { ProjectManager } from '@app/features/project/states/project/project.manager';
import { Project, Task } from '../../models';
import { TaskSelectionService } from '../../services';
import { TaskTableComponent } from '../task-table/task-table.component';

interface ProjectTasks {
  readonly project: Project;
  readonly tasks: readonly Task[];
}

/**
 * Every project, each over its own table.
 *
 * What is left here after the table moved into `app-task-table` is the
 * grouping — and the columns it asks for are capped, because a table inside an
 * accordion cannot spread.
 */
@Component({
  selector: 'app-project-task-list',
  imports: [MatExpansionModule, TaskTableComponent],
  templateUrl: './project-task-list.component.html',
  styleUrl: './project-task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTaskListComponent {
  public tasks = input.required<Task[]>();
  public taskSelected = output<Task>();

  public projectManager = inject(ProjectManager);
  private readonly selection = inject(TaskSelectionService);

  /**
   * One group per project, built once per change. The template used to call a
   * method twice for every project on every change detection — once to read
   * `.length`, once for the table — each call filtering the whole list again.
   */
  public readonly groups = computed<readonly ProjectTasks[]>(() =>
    this.projectManager.projects().map((project) => ({
      project,
      tasks: this.selection.ofProject(this.tasks(), project.id),
    })),
  );
}
