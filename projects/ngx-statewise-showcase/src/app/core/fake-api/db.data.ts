export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'contributor';
  password: string;
  accessToken: string;
  refreshToken: string;
  organizationId: string;
}

export const USERS: User[] = [
  {
    id: '9e85a3a0-1640-42df-0943-08dd7cc96d0f',
    username: 'admin',
    email: 'admin@admin',
    role: 'admin',
    password: 'admin',
    organizationId: 'org-1',
    accessToken:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjllODVhM2EwLTE2NDAtNDJkZi0wOTQzLTA4ZGQ3Y2M5NmQwZiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJhZG1pbiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6ImFkbWluQGFkbWluIiwiQXNwTmV0LklkZW50aXR5LlNlY3VyaXR5U3RhbXAiOiJVR1BCNVlTUFdDU09XVkxVR1hDRFJSR1lNRFFPRkI2RCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImFkbWluIiwib3JnYW5pemF0aW9uSWQiOiJvcmctMSIsImV4cCI6OTc0Nzk5NjYxMSwiYXVkIjoiQ29yZUlkZW50aXR5VXNlciIsImlzcyI6IkNvcmVJZGVudGl0eSJ9.h6EnouzlkFIBMMNRu-HlcSPX5eEJKjFqvDc86NtcA8c',
    refreshToken:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjllODVhM2EwLTE2NDAtNDJkZi0wOTQzLTA4ZGQ3Y2M5NmQwZiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJhZG1pbiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6ImFkbWluQGFkbWluIiwiQXNwTmV0LklkZW50aXR5LlNlY3VyaXR5U3RhbXAiOiJVR1BCNVlTUFdDU09XVkxVR1hDRFJSR1lNRFFPRkI2RCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImFkbWluIiwib3JnYW5pemF0aW9uSWQiOiJvcmctMSIsImV4cCI6OTk0Nzk5NjYxMSwiYXVkIjoiQ29yZUlkZW50aXR5VXNlciIsImlzcyI6IkNvcmVJZGVudGl0eSJ9.tYvH5OpGPJ0Ji6z0uAyWgVtc7k2uO5WmHica47VnN2o',
  },
  {
    id: '8e85a3a0-1640-42df-0943-08dd7cc96d0f',
    username: 'user',
    email: 'user@user',
    role: 'contributor',
    password: 'user',
    organizationId: 'org-1',
    accessToken:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjhlODVhM2EwLTE2NDAtNDJkZi0wOTQzLTA4ZGQ3Y2M5NmQwZiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ1c2VyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoidXNlckB1c2VyIiwiQXNwTmV0LklkZW50aXR5LlNlY3VyaXR5U3RhbXAiOiJVR1BCNVlTUFdDU09XVkxVR1hDRFJSR1lNRFFPRkI2WCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnRyaWJ1dG9yIiwib3JnYW5pemF0aW9uSWQiOiJvcmctMSIsImV4cCI6OTk0Nzk5NjYxMSwiYXVkIjoiQ29yZUlkZW50aXR5VXNlciIsImlzcyI6IkNvcmVJZGVudGl0eSJ9.X2e5gSwAVp0J-qhiI8i-ask3VR9uffrYka3GmROAev0',
    refreshToken:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjhlODVhM2EwLTE2NDAtNDJkZi0wOTQzLTA4ZGQ3Y2M5NmQwZiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ1c2VyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoidXNlckB1c2VyIiwiQXNwTmV0LklkZW50aXR5LlNlY3VyaXR5U3RhbXAiOiJVR1BCNVlTUFdDU09XVkxVR1hDRFJSR1lNRFFPRkI2QSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnRyaWJ1dG9yIiwib3JnYW5pemF0aW9uSWQiOiJvcmctMSIsImV4cCI6OTc0Nzk5NjYxMSwiYXVkIjoiQ29yZUlkZW50aXR5VXNlciIsImlzcyI6IkNvcmVJZGVudGl0eSJ9.C09x1Yd8lxL5nEFZkh8_4VMfEpCr9PRKL4NgGU-xi6I',
  },
];

export interface Task {
  id: string;
  projectId: string;
  organizationId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedUserIds?: string[];
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export const TASKS: Task[] = [
  {
    id: 'task-1',
    projectId: 'project-1',
    organizationId: 'org-1',
    title: 'Create the Dashboard component',
    description: 'Implement a dashboard view with project stats and list.',
    status: 'in-progress',
    assignedUserIds: ['9e85a3a0-1640-42df-0943-08dd7cc96d0f'],
    dueDate: '2025-06-01T23:59:59.999Z',
    priority: 'high',
    createdAt: '2025-05-20T08:00:00.000Z',
    updatedAt: '2025-05-22T10:15:00.000Z',
  },
  {
    id: 'task-2',
    projectId: 'project-1',
    organizationId: 'org-1',
    title: 'Integrate ngx-statewise in the Project module',
    description: 'Define state, actions, and effects for Project entity.',
    status: 'todo',
    assignedUserIds: ['8e85a3a0-1640-42df-0943-08dd7cc96d0f'],
    dueDate: '2025-06-05T18:00:00.000Z',
    priority: 'medium',
    createdAt: '2025-05-21T09:30:00.000Z',
    updatedAt: '2025-05-21T09:30:00.000Z',
  },
  {
    id: 'task-3',
    projectId: 'project-2',
    organizationId: 'org-1',
    title: 'Create the Task list component',
    description: 'Display tasks in a table with filters and actions.',
    status: 'done',
    assignedUserIds: ['8e85a3a0-1640-42df-0943-08dd7cc96d0f'],
    dueDate: '2025-05-22T17:00:00.000Z',
    priority: 'low',
    createdAt: '2025-05-18T14:45:00.000Z',
    updatedAt: '2025-05-20T16:00:00.000Z',
  },
  {
    id: 'task-4',
    projectId: 'project-1',
    organizationId: 'org-1',
    title: 'Add error handling in ProjectService',
    description: 'Show toast message and log errors in devtools.',
    status: 'todo',
    assignedUserIds: [],
    dueDate: '2025-06-07T12:00:00.000Z',
    priority: 'medium',
    createdAt: '2025-05-22T11:00:00.000Z',
    updatedAt: '2025-05-22T11:00:00.000Z',
  },
  {
    id: 'task-5',
    projectId: 'project-2',
    organizationId: 'org-1',
    title: 'Create mocks for json-server',
    description: 'Setup db.json with sample projects, tasks, and users.',
    status: 'in-progress',
    assignedUserIds: [
      '9e85a3a0-1640-42df-0943-08dd7cc96d0f',
      '8e85a3a0-1640-42df-0943-08dd7cc96d0f',
    ],
    dueDate: '2025-05-25T16:30:00.000Z',
    priority: 'high',
    createdAt: '2025-05-19T08:15:00.000Z',
    updatedAt: '2025-05-22T10:00:00.000Z',
  },
];
