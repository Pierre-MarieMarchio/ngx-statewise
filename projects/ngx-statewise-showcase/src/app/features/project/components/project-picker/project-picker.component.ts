import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectManager } from '@app/features/project/states/project/project.manager';
import { Project, Task, TaskStatus } from '../../models';
import { TaskSelectionService } from '../../services';

/** One project, and what is in it. */
interface ProjectRow {
  readonly project: Project;
  readonly total: number;
  readonly counts: Record<TaskStatus, number>;
}

/**
 * Where a project is chosen.
 *
 * This tab used to be five folded accordions with a table in each — the same
 * tasks the tab beside it already showed, cut five ways and none of them
 * usable. What a list of projects is for is choosing one, so that is what it
 * does: pressing a row makes it the current project, and every screen narrows
 * to it.
 *
 * It reads the whole list rather than the current project's tasks, on purpose:
 * the counts have to go on saying what is in the projects nobody chose.
 */
@Component({
  selector: 'app-project-picker',
  imports: [MatIconModule],
  templateUrl: './project-picker.component.html',
  styleUrl: './project-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPickerComponent {
  public readonly tasks = input.required<readonly Task[]>();

  /** Raised once a choice is made, so the page can show what was chosen. */
  public readonly chosen = output<void>();

  public readonly projectManager = inject(ProjectManager);
  private readonly selection = inject(TaskSelectionService);

  public readonly rows = computed<readonly ProjectRow[]>(() =>
    this.projectManager.projects().map((project) => {
      const ofProject = this.selection.ofProject(this.tasks(), project.id);

      return {
        project,
        total: ofProject.length,
        counts: this.selection.countByStatus(ofProject),
      };
    }),
  );

  public readonly total = computed(() => this.tasks().length);

  /** "1 task", not "1 tasks" — the count is read as often as the name. */
  public counted(total: number): string {
    return total === 1 ? '1 task' : `${String(total)} tasks`;
  }

  public choose(projectId: string | null): void {
    this.projectManager.selectProject(projectId);
    this.chosen.emit();
  }
}
