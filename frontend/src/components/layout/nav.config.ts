import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookOpenCheck,
  BarChart3,
  Boxes,
} from 'lucide-react';
import { Role } from '../types';

export interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const navByRole: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { to: '/super-admin', label: 'Bosh sahifa', icon: LayoutDashboard },
    { to: '/super-admin/branches', label: 'Filiallar', icon: Building2 },
    { to: '/super-admin/stats', label: 'Statistika', icon: BarChart3 },
  ],
  BRANCH_ADMIN: [
    { to: '/branch-admin', label: 'Bosh sahifa', icon: LayoutDashboard },
    { to: '/branch-admin/teachers', label: "O'qituvchilar", icon: Users },
    { to: '/branch-admin/students', label: "O'quvchilar", icon: GraduationCap },
    { to: '/branch-admin/groups', label: 'Guruhlar', icon: Boxes },
  ],
  TEACHER: [
    { to: '/teacher', label: 'Bosh sahifa', icon: LayoutDashboard },
    { to: '/teacher/groups', label: 'Guruhlar', icon: Boxes },
    { to: '/teacher/homework', label: 'Vazifalar', icon: BookOpenCheck },
  ],
  STUDENT: [
    { to: '/student', label: 'Bosh sahifa', icon: LayoutDashboard },
    { to: '/student/homework', label: 'Vazifalar', icon: BookOpenCheck },
  ],
};
