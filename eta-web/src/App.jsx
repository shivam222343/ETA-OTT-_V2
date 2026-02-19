import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Loader from './components/Loader';

// Lazy Loaded Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const FacultyDashboard = lazy(() => import('./pages/faculty/Dashboard'));
const ManageInstitution = lazy(() => import('./pages/faculty/ManageInstitution'));
const ManageCourseContent = lazy(() => import('./pages/faculty/ManageCourseContent'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const BranchResources = lazy(() => import('./pages/student/BranchResources'));
const CourseResources = lazy(() => import('./pages/student/CourseResources'));

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// App Routes Component
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        user ? (
          user.role === 'faculty' ? <Navigate to="/faculty/dashboard" replace /> :
            user.role === 'admin' ? <AdminDashboard /> :
              <Navigate to="/student/dashboard" replace />
        ) : <LandingPage />
      } />
      <Route path="/login" element={
        user ? (
          user.role === 'faculty' ? <Navigate to="/faculty/dashboard" replace /> :
            user.role === 'admin' ? <AdminDashboard /> :
              <Navigate to="/student/dashboard" replace />
        ) : <LoginPage />
      } />
      <Route path="/signup" element={
        user ? (
          user.role === 'faculty' ? <Navigate to="/faculty/dashboard" replace /> :
            user.role === 'admin' ? <AdminDashboard /> :
              <Navigate to="/student/dashboard" replace />
        ) : <SignupPage />
      } />

      {/* Protected Routes - Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === 'student' && <Navigate to="/student/dashboard" replace />}
            {user?.role === 'faculty' && <Navigate to="/faculty/dashboard" replace />}
            {user?.role === 'admin' && <AdminDashboard />}
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/branch/:branchId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <BranchResources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/course/:courseId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <CourseResources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <div>Student Courses Page</div>
          </ProtectedRoute>
        }
      />

      {/* Faculty Routes */}
      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/institutions/:institutionId"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <ManageInstitution />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/courses/:courseId/content"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <ManageCourseContent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/institutions"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <div>Faculty Institutions Page</div>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-background text-foreground">
            <Suspense fallback={<Loader />}>
              <AppRoutes />
            </Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  border: '1px solid hsl(var(--border))'
                }
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
