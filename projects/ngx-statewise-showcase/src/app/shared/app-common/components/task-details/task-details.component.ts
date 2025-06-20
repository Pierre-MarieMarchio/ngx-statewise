import { Component, input, output } from '@angular/core';
import { Task } from '@app/core/fake-api/db.data';

@Component({
  selector: 'app-task-details',
  imports: [],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.scss',
})
export class TaskDetailsComponent {
  selectedTask = input<Task | null>();
  close = output<void>();

  onCloseClick() {
    this.close.emit();
  }
}
