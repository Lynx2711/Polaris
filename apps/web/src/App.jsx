import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import useAuth from './hooks/useAuth';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import DriverDashboard from './pages/DriverDashboard';
import Profile from './pages/Profile';
import PlatformAdminDashboard from './pages/PlatformAdminDashboard';

/**
 * Sends users to the right home page based on their role.
 * Dispatchers/admins → /dashboard
 * Drivers            → /driver
 */
function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'driver' ? '/driver' : '/dashboard'} replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Dispatcher / admin dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Platform Admin dashboard */}
            <Route
              path="/platform-admin/dashboard"
              element={
                <ProtectedRoute>
                  <PlatformAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Driver mobile dashboard */}
            <Route
              path="/driver"
              element={
                <ProtectedRoute>
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Root → role-based redirect */}
            <Route path="/" element={<RoleRedirect />} />

            {/* Catch-all → role-based redirect */}
            <Route path="*" element={<RoleRedirect />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
