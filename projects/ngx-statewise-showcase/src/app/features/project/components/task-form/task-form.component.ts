import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PanelFormComponent } from '@shared/ui/panel-form';
import {
  PRIORITIES,
  Project,
  STATUSES,
  Task,
  TaskDraft,
  TaskPriority,
  TaskStatus,
} from '../../models';
import { TEAM_DIRECTORY } from '../../ports';

/**
 * The one form a task is written in, whether it is being created or changed.
 *
 * Two forms would be the same seven fields twice, and the last time a template
 * was copied to a sibling the duplication ratio went to 19.6%. What differs
 * between the two jobs is three words of wording and where the initial values
 * come from, so both are inputs.
 */
@Component({
  selector: 'app-task-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PanelFormComponent,
  ],
  templateUrl: './task-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent implements OnInit {
  /**
   * The projects to choose from, handed in rather than read here: which
   * projects a task may join is the page's composition, not this form's.
   */
  public readonly projects = input.required<readonly Project[]>();

  /**
   * The task being changed, or `null` to write a new one.
   *
   * Read once, in `ngOnInit`, and never watched. The task this points at is
   * derived from the state, so an optimistic write and the rollback behind it
   * both change it, and neither has any business reaching into a field
   * somebody is still typing in.
   */
  public readonly task = input<Task | null>(null);

  /** True while the request is on its way, so a second submit is refused. */
  public readonly pending = input(false);

  /** What the server said when it refused, shown as it came. */
  public readonly refusal = input<string | null>(null);

  public readonly submitted = output<TaskDraft>();
  public readonly cancelled = output<void>();

  public readonly statuses = STATUSES;
  public readonly priorities = PRIORITIES;

  /** Who a task may be assigned to, through the port this feature declares. */
  public readonly directory = inject(TEAM_DIRECTORY);

  public readonly editing = computed(() => this.task() !== null);

  public readonly form = new FormGroup({
    projectId: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    title: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<TaskStatus>('todo', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    priority: new FormControl<TaskPriority>('medium', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    dueDate: new FormControl<string>('', { nonNullable: true }),
    assignedUserIds: new FormControl<string[]>([], { nonNullable: true }),
  });

  public ngOnInit(): void {
    const task = this.task();

    if (!task) {
      return;
    }

    this.form.setValue({
      projectId: task.projectId,
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      // A date field speaks `yyyy-mm-dd`, and a stored date may carry a time.
      dueDate: (task.dueDate ?? '').slice(0, 10),
      assignedUserIds: [...(task.assignedUserIds ?? [])],
    });
  }

  public handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const { description, dueDate, ...rest } = this.form.getRawValue();

    /*
     * What an emptied optional field becomes, and it depends on the job.
     *
     * A creation leaves it out: an empty description is no description, and
     * `''` would store a blank one. An edit sends the empty string, because
     * the update merges what it is handed, so a field left out is a field left
     * alone, so clearing one is the single thing an edit could not otherwise
     * do.
     */
    const emptied = this.editing() ? '' : undefined;

    this.submitted.emit({
      ...rest,
      description: description.trim() || emptied,
      dueDate: dueDate || emptied,
    });
  }
}
