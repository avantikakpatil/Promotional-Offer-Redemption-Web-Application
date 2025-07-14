// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import CustomerDashboard from './components/Dashboard/Customer/CustomerDashboard';
import ResellerDashboard from './components/Dashboard/Reseller/ResellerDashboard';
import ShopkeeperDashboard from './components/Dashboard/Shopkeeper/ShopkeeperDashboard';
import ManufacturerLayout from './components/Dashboard/Manufacturer/ManufacturerLayout';
import DashboardHome from './components/Dashboard/Manufacturer/DashboardHome';
import CampaignCreate from './components/Dashboard/Manufacturer/CampaignCreate';
import ViewCampaigns from './components/Dashboard/Manufacturer/ViewCampaigns';
import QRCodeManagement from './components/Dashboard/Manufacturer/QRCodeManagement';
import ResellerAssign from './components/Dashboard/Manufacturer/ResellerAssign';
import Analytics from './components/Dashboard/Manufacturer/Analytics';
import ResellerManage from './components/Dashboard/Manufacturer/ResellerManage';
import Settings from './components/Dashboard/Manufacturer/Settings';
import Help from './components/Dashboard/Manufacturer/Help';
import Navbar from './components/Common/Navbar';
import Vouchers from './components/Dashboard/Reseller/Vouchers';

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
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                path="/reseller/dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={['reseller']}>
                    <ResellerDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Redirect old routes to new dashboard structure */}
              <Route
                path="/reseller"
                element={<Navigate to="/reseller/dashboard" replace />}
              />
              <Route
                path="/reseller/campaigns"
                element={<Navigate to="/reseller/dashboard/campaigns" replace />}
              />
              <Route
                path="/reseller/vouchers"
                element={<Navigate to="/reseller/dashboard/vouchers" replace />}
              />
              <Route
                path="/reseller/points"
                element={<Navigate to="/reseller/dashboard/points" replace />}
              />
              <Route
                path="/reseller/qr-codes"
                element={<Navigate to="/reseller/dashboard/qr-codes" replace />}
              />
              <Route
                path="/reseller/history"
                element={<Navigate to="/reseller/dashboard/history" replace />}
              />
              <Route
                path="/reseller/settings"
                element={<Navigate to="/reseller/dashboard/settings" replace />}
              />
              <Route
                path="/reseller/dashboard/vouchers"
                element={
                  <ProtectedRoute allowedRoles={['reseller']}>
                    <Vouchers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shopkeeper/dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={['shopkeeper']}>
                    <ShopkeeperDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Manufacturer Routes */}
              <Route
                path="/manufacturer/*"
                element={
                  <ProtectedRoute allowedRoles={['manufacturer']}>
                    <ManufacturerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardHome />} />
                <Route path="campaign/create" element={<CampaignCreate />} />
                <Route path="campaigns" element={<ViewCampaigns />} />
                <Route path="qr-codes" element={<QRCodeManagement />} />
                <Route path="assign-reseller" element={<ResellerAssign />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="resellers" element={<ResellerManage />} />
                <Route path="settings" element={<Settings />} />
                <Route path="help" element={<Help />} />
              </Route>

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
