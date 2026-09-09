import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { TaskColumnsService, TaskSelectionService } from '../../services';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { TaskOpenColumnComponent } from '../task-open-column/task-open-column.component';
import { Project, Task } from '../../models';

interface ProjectTasks {
  readonly project: Project;
  readonly tasks: readonly Task[];
}
import { ProjectManager } from '@app/features/project/states/project/project.manager';

@Component({
  selector: 'app-project-task-list',
  imports: [MatExpansionModule, MatTableModule, TaskOpenColumnComponent],
  templateUrl: './project-task-list.component.html',
  styleUrl: './project-task-list.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTaskListComponent {
  public tasks = input.required<Task[]>();
  public taskSelected = output<Task>();

  public projectManager = inject(ProjectManager);
  private readonly selection = inject(TaskSelectionService);
  private readonly taskColumns = inject(TaskColumnsService);

  public readonly columns = this.taskColumns.cappedColumns;
  public readonly displayedColumns = this.taskColumns.displayedColumns;

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

  public selectTask(task: Task) {
    this.taskSelected.emit(task);
  }
}
