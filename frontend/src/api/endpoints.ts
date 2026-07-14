import { apiClient } from './client';
import {
  AuthUser,
  Branch,
  Group,
  Homework,
  HomeworkResultRow,
  NotificationItem,
  StudentDashboardSummary,
} from '../types';

// --- Auth --------------------------------------------------------------------
export const authApi = {
  login: (phone: string, password: string) =>
    apiClient.post<{ success: true; data: { accessToken: string; refreshToken: string; user: AuthUser } }>(
      '/auth/login',
      { phone, password },
    ),
  me: () => apiClient.get<{ success: true; data: AuthUser }>('/auth/me'),
};

// --- Branches (Super Admin) --------------------------------------------------
export const branchApi = {
  list: (page = 1, limit = 20) =>
    apiClient.get<{ success: true; data: Branch[]; pagination: any }>('/branches', {
      params: { page, limit },
    }),
  create: (payload: { name: string; address?: string; phone?: string }) =>
    apiClient.post('/branches', payload),
  update: (id: string, payload: Partial<Branch>) => apiClient.patch(`/branches/${id}`, payload),
  stats: (id: string) => apiClient.get(`/branches/${id}/stats`),
};

// --- Users (teachers / students / branch admins) ------------------------------
export const userApi = {
  createBranchAdmin: (payload: {
    fullName: string;
    phone: string;
    password: string;
    branchId: string;
  }) => apiClient.post('/users/branch-admins', payload),
  createTeacher: (payload: { fullName: string; phone: string; password: string }) =>
    apiClient.post('/users/teachers', payload),
  listTeachers: (page = 1, limit = 20) =>
    apiClient.get('/users/teachers', { params: { page, limit } }),
  teacherActivity: (teacherUserId: string) => apiClient.get(`/users/teachers/${teacherUserId}/activity`),
  createStudent: (payload: { fullName: string; phone: string; password: string; groupId?: string }) =>
    apiClient.post('/users/students', payload),
  listStudents: (page = 1, limit = 20) =>
    apiClient.get('/users/students', { params: { page, limit } }),
  setPayment: (payload: { studentId: string; month: string; status: string; amount: number }) =>
    apiClient.post('/users/payments', payload),
};

// --- Groups --------------------------------------------------------------------
export const groupApi = {
  list: () => apiClient.get<{ success: true; data: Group[] }>('/groups'),
  create: (payload: { name: string; teacherId: string }) => apiClient.post('/groups', payload),
  update: (id: string, payload: Partial<Group>) => apiClient.patch(`/groups/${id}`, payload),
  addStudent: (groupId: string, studentId: string) =>
    apiClient.post(`/groups/${groupId}/students`, { studentId }),
};

// --- Homework --------------------------------------------------------------------
export const homeworkApi = {
  createTeacher: (formData: FormData) =>
    apiClient.post('/homework', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  listForTeacher: (page = 1, limit = 20) =>
    apiClient.get<{ success: true; data: Homework[]; pagination: any }>('/homework', {
      params: { page, limit },
    }),
  stats: (id: string) => apiClient.get(`/homework/${id}/stats`),
  studentDashboard: () =>
    apiClient.get<{ success: true; data: StudentDashboardSummary }>('/homework/student/dashboard'),
  listForStudent: () =>
    apiClient.get<{ success: true; data: HomeworkResultRow[] }>('/homework/student/list'),
};

// --- So'zdon (mock backend contract; real button opens sozdon.uz directly) -----
export const sozdonApi = {
  start: (homeworkId: string) => apiClient.post('/sozdon/start', { homeworkId }),
};

// --- Notifications -----------------------------------------------------------
export const notificationApi = {
  list: (page = 1, limit = 20) =>
    apiClient.get<{
      success: true;
      data: { items: NotificationItem[]; unreadCount: number };
      pagination: any;
    }>('/notifications', { params: { page, limit } }),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
};

// --- Super Admin stats ---------------------------------------------------------
export const statsApi = {
  platform: () => apiClient.get('/stats/platform'),
  exportBranchesPdf: () => apiClient.get('/stats/branches/export.pdf', { responseType: 'blob' }),
};
