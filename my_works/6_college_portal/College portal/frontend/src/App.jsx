import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Signup from './signup';
import Login from './Login';
import StudentForm from './StudentForm';
import StudentDetails from './StudentDetails';
import StudentProfile from './StudentProfile';
import StudentDashboard from './StudentDashboard';
import StudentViewPage from './StudentViewPage';
import VerifyOtp from './verify-otp';
import AdminDashboard from './AdminDashboard';
import TeacherProfile from './TeacherProfile';
import TeacherClassStudents from './TeacherClassStudents';
import Navbar from './navbar/Navbar';
import { NavbarProvider } from './navbar/NavbarContext';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Blocks teachers from /student-form; students with existing profile go to dashboard
const NoProfileRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = localStorage.getItem('userRole');
  if (role === 'teacher') return <Navigate to="/" replace />;
  const hasProfile = localStorage.getItem('hasExistingProfile') === 'true';
  if (hasProfile) return <Navigate to="/student-dashboard" replace />;
  return children;
};

// Blocks non-admins from /admin-dashboard
const AdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = localStorage.getItem('userRole');
  if (role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

// Blocks non-teachers from /student-details
const TeacherRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = localStorage.getItem('userRole');
  if (role !== 'teacher') return <Navigate to="/" replace />;
  return children;
};

// Blocks access to /student-dashboard if profile not yet filled (teachers always allowed)
const HasProfileRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = localStorage.getItem('userRole');
  if (role === 'teacher') return children;
  const hasProfile = localStorage.getItem('hasExistingProfile') === 'true';
  if (!hasProfile) return <Navigate to="/" replace />;
  return children;
};

// Re-validates profile existence from server on dashboard load
function ValidatedDashboardRoute({ children }) {
  const [status, setStatus] = React.useState('checking');
  React.useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role === 'teacher') { setStatus('ok'); return; }
    const email = localStorage.getItem('userEmail');
    if (!email) { setStatus('no-profile'); return; }
    fetch(`https://studentportal-production-3f43.up.railway.app/api/students?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        const record = Array.isArray(data) ? data[0] : (data && data.id ? data : null);
        if (record) {
          localStorage.setItem('hasExistingProfile', 'true');
          setStatus('ok');
        } else {
          localStorage.setItem('hasExistingProfile', 'false');
          setStatus('no-profile');
        }
      })
      .catch(() => setStatus('ok')); // on network error, allow through — dashboard handles it
  }, []);
  if (status === 'checking') return null;
  if (status === 'no-profile') return <Navigate to="/student-form" replace />;
  return children;
}

function LoginRoute() {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  if (!isAuthenticated) return <WithNavbar><Login /></WithNavbar>;
  const role = localStorage.getItem('userRole');
  if (role === 'admin') return <Navigate to="/admin-dashboard" replace />;
  if (role === 'teacher') return <Navigate to="/student-dashboard" replace />;
  return localStorage.getItem('hasExistingProfile') === 'true'
    ? <Navigate to="/student-dashboard" replace />
    : <Navigate to="/student-form" replace />;
}

function WithNavbar({ children }) {
  return (
    <NavbarProvider>
      <Navbar />
      {children}
    </NavbarProvider>
  );
}

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<WithNavbar><Home /></WithNavbar>} />

        <Route path="/signup" element={<WithNavbar><Signup /></WithNavbar>} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/verify-otp" element={<WithNavbar><VerifyOtp /></WithNavbar>} />

        {/* Protected Registration Form Route — blocked if profile already exists */}
        <Route
          path="/student-form"
          element={
            <NoProfileRoute>
              <WithNavbar><StudentForm /></WithNavbar>
            </NoProfileRoute>
          }
        />

        {/* Protected Active Student Profile Route — blocked if no profile */}
        <Route
          path="/student-profile"
          element={
            <HasProfileRoute>
              <WithNavbar><StudentProfile /></WithNavbar>
            </HasProfileRoute>
          }
        />

        <Route
          path="/student-dashboard"
          element={
            <HasProfileRoute>
              <ValidatedDashboardRoute>
                <StudentDashboard />
              </ValidatedDashboardRoute>
            </HasProfileRoute>
          }
        />

        {/* Protected Student Details Route — teachers only */}
        <Route
          path="/student-details"
          element={
            <TeacherRoute>
              <WithNavbar><StudentDetails /></WithNavbar>
            </TeacherRoute>
          }
        />

        {/* Student View Page — individual student record */}
        <Route
          path="/student-view/:id"
          element={
            <ProtectedRoute>
              <StudentViewPage />
            </ProtectedRoute>
          }
        />

        {/* Teacher Profile — own profile (teacher) or view by email (admin) */}
        <Route
          path="/teacher-profile"
          element={
            <TeacherRoute>
              <WithNavbar><TeacherProfile /></WithNavbar>
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher-profile/:emailParam"
          element={
            <ProtectedRoute>
              <WithNavbar><TeacherProfile /></WithNavbar>
            </ProtectedRoute>
          }
        />

        {/* Teacher Class Students */}
        <Route
          path="/teacher-class-students/:className"
          element={
            <TeacherRoute>
              <WithNavbar><TeacherClassStudents /></WithNavbar>
            </TeacherRoute>
          }
        />

        {/* Admin / Principal Dashboard — admin only */}
        <Route
          path="/admin-dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
