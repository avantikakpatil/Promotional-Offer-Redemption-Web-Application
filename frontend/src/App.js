// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import CustomerDashboard from './components/Dashboard/Customer/CustomerDashboard';
import ResellerDashboard from './components/Dashboard/Reseller/ResellerDashboard';
import ManufacturerDashboard from './components/Dashboard/Manufacturer/ManufacturerDashboard';
import Navbar from './components/Common/Navbar';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// Dashboard Components (Placeholder)
const Unauthorized = () => <div>Unauthorized Access</div>;

function App() {
  return (
    <GoogleOAuthProvider clientId="668739978753-voajnah04b9p827o88g29atiqqlmdon7.apps.googleusercontent.com">
      <Router>
        <AuthProvider>
          <div className="app">
            <Navbar />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Routes */}
              <Route
                path="/customer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reseller/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['reseller']}>
                    <ResellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['manufacturer']}>
                    <ManufacturerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
