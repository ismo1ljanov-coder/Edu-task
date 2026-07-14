import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { AppToaster } from './components/ui/toast';

// Lazy-loaded route-level pages -> separate chunks per role (code splitting).
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));

const SuperAdminDashboardPage = lazy(() =>
  import('./pages/superAdmin/SuperAdminDashboardPage').then((m) => ({ default: m.SuperAdminDashboardPage })),
);
const SuperAdminBranchesPage = lazy(() =>
  import('./pages/superAdmin/SuperAdminBranchesPage').then((m) => ({ default: m.SuperAdminBranchesPage })),
);
const SuperAdminStatsPage = lazy(() =>
  import('./pages/superAdmin/SuperAdminStatsPage').then((m) => ({ default: m.SuperAdminStatsPage })),
);

const BranchAdminDashboardPage = lazy(() =>
  import('./pages/branchAdmin/BranchAdminDashboardPage').then((m) => ({
    default: m.BranchAdminDashboardPage,
  })),
);
const BranchTeachersPage = lazy(() =>
  import('./pages/branchAdmin/BranchTeachersPage').then((m) => ({ default: m.BranchTeachersPage })),
);
const BranchStudentsPage = lazy(() =>
  import('./pages/branchAdmin/BranchStudentsPage').then((m) => ({ default: m.BranchStudentsPage })),
);
const BranchGroupsPage = lazy(() =>
  import('./pages/branchAdmin/BranchGroupsPage').then((m) => ({ default: m.BranchGroupsPage })),
);

const TeacherDashboardPage = lazy(() =>
  import('./pages/teacher/TeacherDashboardPage').then((m) => ({ default: m.TeacherDashboardPage })),
);
const TeacherGroupsPage = lazy(() =>
  import('./pages/teacher/TeacherGroupsPage').then((m) => ({ default: m.TeacherGroupsPage })),
);
const TeacherHomeworkPage = lazy(() =>
  import('./pages/teacher/TeacherHomeworkPage').then((m) => ({ default: m.TeacherHomeworkPage })),
);

const StudentDashboardPage = lazy(() =>
  import('./pages/student/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage })),
);
const StudentHomeworkPage = lazy(() =>
  import('./pages/student/StudentHomeworkPage').then((m) => ({ default: m.StudentHomeworkPage })),
);

function PageFallback() {
  return <div className="flex h-screen items-center justify-center text-brand-slate">Yuklanmoqda...</div>;
}

const roleHome: Record<string, string> = {
  SUPER_ADMIN: '/super-admin',
  BRANCH_ADMIN: '/branch-admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
};

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageFallback />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome[user.role] ?? '/login'} replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route element={<AppShell />}>
            <Route path="/super-admin" element={<SuperAdminDashboardPage />} />
            <Route path="/super-admin/branches" element={<SuperAdminBranchesPage />} />
            <Route path="/super-admin/stats" element={<SuperAdminStatsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['BRANCH_ADMIN']} />}>
          <Route element={<AppShell />}>
            <Route path="/branch-admin" element={<BranchAdminDashboardPage />} />
            <Route path="/branch-admin/teachers" element={<BranchTeachersPage />} />
            <Route path="/branch-admin/students" element={<BranchStudentsPage />} />
            <Route path="/branch-admin/groups" element={<BranchGroupsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
          <Route element={<AppShell />}>
            <Route path="/teacher" element={<TeacherDashboardPage />} />
            <Route path="/teacher/groups" element={<TeacherGroupsPage />} />
            <Route path="/teacher/homework" element={<TeacherHomeworkPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route element={<AppShell />}>
            <Route path="/student" element={<StudentDashboardPage />} />
            <Route path="/student/homework" element={<StudentHomeworkPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppToaster />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
