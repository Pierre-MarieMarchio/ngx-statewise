import {
  Component,
  inject,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { Task } from '@shared/app-common/models';
import { TASK_MANAGER } from '@shared/app-common/tokens';
import { SidePanelComponent } from '@shared/ui/side-panel';
import { DataStateComponent } from '@shared/ui/data-state';
import { TaskDetailsComponent } from '@shared/app-common/components';
import {
  TaskKanbanComponent,
  AllTaskListComponent,
  PersonalTaskListComponent,
  ProjectTaskListComponent,
} from '../../components';

@Component({
  selector: 'app-task-page',
  imports: [
    SidePanelComponent,
    AllTaskListComponent,
    DataStateComponent,
    TaskDetailsComponent,
    MatIconModule,
    MatTabsModule,
    PersonalTaskListComponent,
    ProjectTaskListComponent,
    TaskKanbanComponent,
  ],
  templateUrl: './task-page.component.html',
  styleUrl: './task-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class TaskPageComponent {
  @ViewChild('taskPanel') taskPanel!: SidePanelComponent;

  public readonly taskManager = inject(TASK_MANAGER);

  public selectedTask = signal<Task | null>(null);

  public closeSideNav(): void {
    this.taskPanel.close();
  }

  public toggleSideNav(): void {
    this.taskPanel.toggle();
  }

  public selectTask(task: Task): void {
    this.selectedTask.set(task);
    this.taskPanel.open();
  }

  public onTaskChanged(updatedTask: Task): void {
    this.taskManager.update(updatedTask);
  }
}
