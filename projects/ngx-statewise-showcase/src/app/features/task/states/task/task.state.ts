import { Injectable, signal } from "@angular/core";
import { Task } from "@app/core/fake-api/db.data";

@Injectable({
  providedIn: 'root',
})
export class TaskState {
  public tasks = signal<Task[] >([]);
  public isLoading = signal(false);
  public isError = signal(false);
}
