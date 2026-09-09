import {
  ChangeDetectionStrategy,
  Component,
  input,
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
  TaskDraft,
  TaskPriority,
  TaskStatus,
} from '../../models';

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
export class TaskFormComponent {
  /**
   * The projects to choose from, handed in rather than read here: which
   * projects a task may join is the page's composition, not this form's.
   */
  public readonly projects = input.required<readonly Project[]>();

  /** True while a creation is on its way, so a second submit is refused. */
  public readonly pending = input(false);

  /** What the server said when it refused, shown as it came. */
  public readonly refusal = input<string | null>(null);

  public readonly submitted = output<TaskDraft>();
  public readonly cancelled = output<void>();

  public readonly statuses = STATUSES;
  public readonly priorities = PRIORITIES;

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
  });

  public handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const { description, ...rest } = this.form.getRawValue();

    // An empty description is no description: the field is optional on the
    // draft, and sending '' would store a blank one.
    this.submitted.emit(
      description.trim().length > 0
        ? { ...rest, description: description.trim() }
        : rest,
    );
  }
}
