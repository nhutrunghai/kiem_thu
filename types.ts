
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum EventType {
  REGULAR = 'REGULAR',
  ONLINE = 'ONLINE',
  EXAM = 'EXAM'
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  major: string;
  avatar?: string;
}

export interface TimetableEvent {
  id: string;
  title: string;
  code?: string;
  instructor: string;
  room: string;
  link?: string;
  type: EventType;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: string;
  notes?: string;
  reminderMinutes?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  relatedEventId?: string;
  attachments: Attachment[];
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Note {
  id: string;
  eventId: string;
  content: string;
  updatedAt: string;
}
