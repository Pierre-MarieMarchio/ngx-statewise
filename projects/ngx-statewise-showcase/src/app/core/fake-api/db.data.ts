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
    username: 'user1',
    email: 'user1@user',
    role: 'contributor',
    password: 'user1',
    organizationId: 'org-1',
    accessToken:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjhlODVhM2EwLTE2NDAtNDJkZi0wOTQzLTA4ZGQ3Y2M5NmQwZiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ1c2VyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoidXNlckB1c2VyIiwiQXNwTmV0LklkZW50aXR5LlNlY3VyaXR5U3RhbXAiOiJVR1BCNVlTUFdDU09XVkxVR1hDRFJSR1lNRFFPRkI2WCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnRyaWJ1dG9yIiwib3JnYW5pemF0aW9uSWQiOiJvcmctMSIsImV4cCI6OTk0Nzk5NjYxMSwiYXVkIjoiQ29yZUlkZW50aXR5VXNlciIsImlzcyI6IkNvcmVJZGVudGl0eSJ9.X2e5gSwAVp0J-qhiI8i-ask3VR9uffrYka3GmROAev0',
    refreshToken:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjhlODVhM2EwLTE2NDAtNDJkZi0wOTQzLTA4ZGQ3Y2M5NmQwZiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ1c2VyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoidXNlckB1c2VyIiwiQXNwTmV0LklkZW50aXR5LlNlY3VyaXR5U3RhbXAiOiJVR1BCNVlTUFdDU09XVkxVR1hDRFJSR1lNRFFPRkI2QSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnRyaWJ1dG9yIiwib3JnYW5pemF0aW9uSWQiOiJvcmctMSIsImV4cCI6OTc0Nzk5NjYxMSwiYXVkIjoiQ29yZUlkZW50aXR5VXNlciIsImlzcyI6IkNvcmVJZGVudGl0eSJ9.C09x1Yd8lxL5nEFZkh8_4VMfEpCr9PRKL4NgGU-xi6I',
  },
  {
    id: '7e85a3a0-1640-42df-0943-08dd7cc96d0f',
    username: 'user2',
    email: 'user2@user',
    role: 'contributor',
    password: 'user2',
    organizationId: 'org-2',
    accessToken:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjdlODVhM2EwLTE2NDAtNDJkZi0wOTQzLTA4ZGQ3Y2M5NmQwZiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ1c2VyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoidXNlckB1c2VyIiwiQXNwTmV0LklkZW50aXR5LlNlY3VyaXR5U3RhbXAiOiJVR1BCNVlTUFdDU09XVkxVR1hDRFJSR1lNRFFPRkI2WCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnRyaWJ1dG9yIiwib3JnYW5pemF0aW9uSWQiOiJvcmctMiIsImV4cCI6OTk0Nzk5NjYxMSwiYXVkIjoiQ29yZUlkZW50aXR5VXNlciIsImlzcyI6IkNvcmVJZGVudGl0eSJ9.hNvWWMsq_RfCEc2K1dF-U9dFkrs7oCpboJj6hiaUlME',
    refreshToken:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjdlODVhM2EwLTE2NDAtNDJkZi0wOTQzLTA4ZGQ3Y2M5NmQwZiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ1c2VyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoidXNlckB1c2VyIiwiQXNwTmV0LklkZW50aXR5LlNlY3VyaXR5U3RhbXAiOiJVR1BCNVlTUFdDU09XVkxVR1hDRFJSR1lNRFFPRkI2QSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnRyaWJ1dG9yIiwib3JnYW5pemF0aW9uSWQiOiJvcmctMiIsImV4cCI6OTc0Nzk5NjYxMSwiYXVkIjoiQ29yZUlkZW50aXR5VXNlciIsImlzcyI6IkNvcmVJZGVudGl0eSJ9.-mBw5R_PyoS2bQFcRCbFWcKrGOFGqFwivONoONKoyX4',
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
    title: 'Develop Dashboard UI with Project Insights',
    description:
      'Design and implement a dashboard to show key project metrics and recent activity.',
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
    title: 'Set Up State Management for Project Module',
    description:
      'Define state models, actions, and effects using ngx-statewise for the Project module.',
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
    title: 'Build Task Table with Filters and Actions',
    description:
      'Display tasks in a paginated table with filter and action controls.',
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
    title: 'Implement Error Handling in ProjectService',
    description:
      'Add error notifications using toast and log errors to dev console.',
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
    title: 'Create Mock API with JSON Server',
    description:
      'Build a db.json file containing sample projects, tasks, and users for development.',
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
  {
    id: 'task-6',
    projectId: 'project-3',
    organizationId: 'org-2',
    title: 'Prepare Development Data Set for API Testing',
    description:
      'Provide realistic mock data via JSON server for frontend integration tests.',
    status: 'in-progress',
    assignedUserIds: ['7e85a3a0-1640-42df-0943-08dd7cc96d0f'],
    dueDate: '2025-05-25T16:30:00.000Z',
    priority: 'medium',
    createdAt: '2025-05-19T08:15:00.000Z',
    updatedAt: '2025-05-22T10:00:00.000Z',
  },
  {
    id: 'task-7',
    projectId: 'project-3',
    organizationId: 'org-2',
    title: 'Add Global Error Handling in Services',
    description:
      'Introduce a consistent error-handling strategy with user feedback and logging.',
    status: 'todo',
    assignedUserIds: ['7e85a3a0-1640-42df-0943-08dd7cc96d0f'],
    dueDate: '2025-05-25T16:30:00.000Z',
    priority: 'high',
    createdAt: '2025-05-19T08:15:00.000Z',
    updatedAt: '2025-05-22T10:00:00.000Z',
  },
  {
    id: 'task-8',
    projectId: 'project-4',
    organizationId: 'org-2',
    title: 'Log Errors and Display Toast Messages',
    description:
      'Provide user-friendly error messages and write errors to console for debugging.',
    status: 'todo',
    assignedUserIds: [],
    dueDate: '2025-05-25T16:30:00.000Z',
    priority: 'medium',
    createdAt: '2025-05-19T08:15:00.000Z',
    updatedAt: '2025-05-22T10:00:00.000Z',
  },
  {
    id: 'task-9',
    projectId: 'project-5',
    organizationId: 'org-3',
    title: 'Implement Task Viewer Component',
    description:
      'Create a dedicated component to list and filter user tasks effectively.',
    status: 'todo',
    assignedUserIds: [],
    dueDate: '2025-05-25T16:30:00.000Z',
    priority: 'medium',
    createdAt: '2025-05-19T08:15:00.000Z',
    updatedAt: '2025-05-22T10:00:00.000Z',
  },
];

export interface Project {
  id: string;
  organizationId: string;
  title: string;
}
export const PROJECT: Project[] = [
  {
    id: 'project-5',
    organizationId: 'org-3',
    title: 'project-5',
  },
  {
    id: 'project-4',
    organizationId: 'org-2',
    title: 'project-4',
  },
  {
    id: 'project-3',
    organizationId: 'org-2',
    title: 'project-3',
  },
  {
    id: 'project-2',
    organizationId: 'org-1',
    title: 'project-2',
  },
  {
    id: 'project-1',
    organizationId: 'org-1',
    title: 'project-1',
  },
];
