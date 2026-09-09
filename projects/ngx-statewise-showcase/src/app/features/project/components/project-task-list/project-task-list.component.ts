import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { TaskColumnsService, TaskSelectionService } from '../../services';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { Task } from '../../models';
import { ProjectManager } from '@app/features/project/states/project/project.manager';

@Component({
  selector: 'app-project-task-list',
  imports: [MatExpansionModule, MatTableModule],
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

  public selectTask(task: Task) {
    this.taskSelected.emit(task);
  }

  public getFilteredTasks(projectId: string): Task[] {
    return this.selection.ofProject(this.tasks(), projectId);
  }
}
