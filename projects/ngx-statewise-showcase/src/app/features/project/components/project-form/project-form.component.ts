import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
  Project,
  ProjectColor,
  ProjectDraft,
  PROJECT_COLORS,
} from '../../models';

/**
 * The one form a project is written in, whether it is being created or
 * renamed. The same arrangement as `app-task-form`, and for the same reason:
 * two fields written twice is two places for them to drift.
 */
@Component({
  selector: 'app-project-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PanelFormComponent,
  ],
  templateUrl: './project-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormComponent implements OnInit {
  /**
   * The project being renamed, or `null` to write a new one. Read once, in
   * `ngOnInit`, so a reload that changed it does not reach into a field
   * somebody is typing in.
   */
  public readonly project = input<Project | null>(null);

  /** True while a write is on its way, so a second submit is refused. */
  public readonly pending = input(false);

  /**
   * What the server said when it refused. Shown as it came: the form cannot
   * know that a title is taken, and only the server can name which one.
   */
  public readonly refusal = input<string | null>(null);

  public readonly submitted = output<ProjectDraft>();
  public readonly cancelled = output<void>();

  public readonly colors = PROJECT_COLORS;

  public readonly editing = computed(() => this.project() !== null);

  public readonly form = new FormGroup({
    title: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    color: new FormControl<ProjectColor>('blue', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  public ngOnInit(): void {
    const project = this.project();

    if (project) {
      this.form.setValue({ title: project.title, color: project.color });
    }
  }

  public handleSubmit(): void {
    if (this.form.invalid) {
      // Material renders an error only once a control has been touched, so an
      // untouched form would otherwise submit and show nothing.
      this.form.markAllAsTouched();

      return;
    }

    this.submitted.emit(this.form.getRawValue());
  }
}
