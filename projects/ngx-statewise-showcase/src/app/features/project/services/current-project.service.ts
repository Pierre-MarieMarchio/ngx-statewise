import { computed, inject, Injectable } from '@angular/core';
import { ProjectManager } from '../states/project/project.manager';
import { TaskManager } from '../states/task/task.manager';
import { TaskSelectionService } from './task-selection.service';

/**
 * What the screens see once a project has been chosen.
 *
 * A derivation over two states and nothing else: which project is current is
 * the project state's, which tasks exist is the task state's, and neither has
 * any business knowing about the other. Nothing is stored here — the moment a
 * task moves or the choice changes, every reader of these signals is right
 * again without anyone having to remember to recompute.
 *
 * With no project chosen it answers for all of them, which is what makes the
 * choice something a screen can offer rather than something it depends on.
 */
@Injectable({ providedIn: 'root' })
export class CurrentProjectService {
  private readonly projectManager = inject(ProjectManager);
  private readonly taskManager = inject(TaskManager);
  private readonly selection = inject(TaskSelectionService);

  public readonly project = this.projectManager.selectedProject;
  public readonly projectId = this.projectManager.selectedProjectId;

  /**
   * The tasks on screen for the current project — and the search still
   * applies, because `visibleTasks` is what a filter left behind. Two
   * narrowings compose; neither cancels the other.
   */
  public readonly tasks = computed(() => {
    const projectId = this.projectId();
    const visible = this.taskManager.visibleTasks();

    return projectId === null
      ? visible
      : this.selection.ofProject(visible, projectId);
  });

  public readonly taskCount = computed(() => this.tasks().length);

  public readonly countByStatus = computed(() =>
    this.selection.countByStatus(this.tasks()),
  );

  /** What a heading says it is showing. */
  public readonly title = computed(
    () => this.project()?.title ?? 'All projects',
  );
}
