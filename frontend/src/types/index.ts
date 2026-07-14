export type Role = 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'TEACHER' | 'STUDENT';

export type HomeworkLevel =
  | 'BEGINNER'
  | 'ELEMENTARY'
  | 'INTERMEDIATE'
  | 'UPPER_INTERMEDIATE'
  | 'ADVANCED';

export type HomeworkResultStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type PaymentStatus = 'PAID' | 'UNPAID' | 'OVERDUE';
export type NotificationType =
  | 'HOMEWORK_ASSIGNED'
  | 'HOMEWORK_COMPLETED'
  | 'NEW_STUDENT'
  | 'ANNOUNCEMENT';

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  role: Role;
  branchId: string | null;
}

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { teachers: number; students: number; groups: number };
}

export interface Group {
  id: string;
  name: string;
  branchId: string;
  teacherId: string;
  isActive: boolean;
  teacher?: { user: { fullName: string } };
  _count?: { students: number; homeworks: number };
}

export interface HomeworkWord {
  id: string;
  word: string;
  translation?: string | null;
}

export interface Homework {
  id: string;
  title: string;
  description?: string | null;
  level: HomeworkLevel;
  startDate: string;
  endDate: string;
  group?: { name: string };
  words?: HomeworkWord[];
  _count?: { words: number; results: number };
}

export interface HomeworkResultRow {
  id: string;
  status: HomeworkResultStatus;
  progress: number;
  homework: {
    id: string;
    title: string;
    level: HomeworkLevel;
    startDate: string;
    endDate: string;
    description?: string | null;
    _count: { words: number };
  };
}

export interface StudentDashboardSummary {
  todayTasksCount: number;
  notCompletedCount: number;
  completedCount: number;
  xp: number;
  streak: number;
  progressPercent: number;
  totalHomeworkCount: number;
}

export interface TeacherDashboardSummary {
  groupsCount: number;
  homeworkCount: number;
  activeStudents: number;
  averageCompletionPercent: number;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
