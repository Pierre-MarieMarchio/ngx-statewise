import { TestBed } from '@angular/core/testing';
import { sampleTask } from '@testing/fake-managers';
import { TaskSelectionService } from './task-selection.service';

const TASKS = [
  sampleTask({ id: 'a', projectId: 'project-1', status: 'todo' }),
  sampleTask({ id: 'b', projectId: 'project-1', status: 'done' }),
  sampleTask({ id: 'c', projectId: 'project-2', status: 'todo' }),
];

describe('TaskSelectionService', () => {
  let selection: TaskSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    selection = TestBed.inject(TaskSelectionService);
  });

  it('keeps the tasks of one column', () => {
    expect(selection.inStatus(TASKS, 'todo').map((task) => task.id)).toEqual([
      'a',
      'c',
    ]);
  });

  it('keeps the tasks of one project', () => {
    expect(
      selection.ofProject(TASKS, 'project-1').map((task) => task.id),
    ).toEqual(['a', 'b']);
  });

  /** The managers report `null` before their first answer. */
  it('answers an empty list for nothing at all', () => {
    expect(selection.inStatus(null, 'todo')).toEqual([]);
    expect(selection.ofProject(undefined, 'project-1')).toEqual([]);
  });
});
