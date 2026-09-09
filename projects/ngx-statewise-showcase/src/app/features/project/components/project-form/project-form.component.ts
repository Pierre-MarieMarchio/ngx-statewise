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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProjectColor, ProjectDraft, PROJECT_COLORS } from '../../models';

@Component({
  selector: 'app-project-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormComponent {
  /** True while a creation is on its way, so a second submit is refused. */
  public readonly pending = input(false);

  /**
   * What the server said when it refused. Shown as it came: the form cannot
   * know that a title is taken, and only the server can name which one.
   */
  public readonly refusal = input<string | null>(null);

  public readonly submitted = output<ProjectDraft>();
  public readonly cancelled = output<void>();

  public readonly colors = PROJECT_COLORS;

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
