// src/components/Common/Navbar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'manufacturer':
        return '/manufacturer/dashboard';
      case 'reseller':
        return '/reseller/dashboard';
      case 'shopkeeper':
        return '/shopkeeper/dashboard';
      case 'customer':
        return '/customer/dashboard';
      default:
        return '/';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'manufacturer':
        return 'Manufacturer';
      case 'reseller':
        return 'Reseller/Dealer';
      case 'shopkeeper':
        return 'Shopkeeper';
      case 'customer':
        return 'Customer';
      default:
        return role;
    }
  };

  if (!user) {
    return null; // Don't show navbar on login/signup pages
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>B2B Promotional Offers</h1>
      </div>
      <div className="navbar-menu">
        <div className="navbar-links">
          <button 
            onClick={() => navigate(getDashboardLink())}
            className={`nav-link ${location.pathname.includes('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </button>
          {user.role === 'manufacturer' && (
            <>
              <button 
                onClick={() => navigate('/manufacturer/campaign/create')}
                className={`nav-link ${location.pathname.includes('/campaign/create') ? 'active' : ''}`}
              >
                Create Campaign
              </button>
              <button 
                onClick={() => navigate('/manufacturer/resellers')}
                className={`nav-link ${location.pathname.includes('/resellers') ? 'active' : ''}`}
              >
                Manage Resellers
              </button>
              <button 
                onClick={() => navigate('/manufacturer/analytics')}
                className={`nav-link ${location.pathname.includes('/analytics') ? 'active' : ''}`}
              >
                Analytics
              </button>
            </>
          )}
          {user.role === 'reseller' && (
            <>
              <button 
                onClick={() => navigate('/reseller/dashboard/campaigns')}
                className={`nav-link ${location.pathname.includes('/campaigns') ? 'active' : ''}`}
              >
                My Campaigns
              </button>
              <button 
                onClick={() => navigate('/reseller/dashboard/vouchers')}
                className={`nav-link ${location.pathname.includes('/vouchers') ? 'active' : ''}`}
              >
                My Vouchers
              </button>
            </>
          )}
          {user.role === 'shopkeeper' && (
            <>
              <button 
                onClick={() => navigate('/shopkeeper/dashboard')}
                className={`nav-link ${location.pathname.includes('/shopkeeper') ? 'active' : ''}`}
              >
                Scan QR Code
              </button>
              <button 
                onClick={() => navigate('/shopkeeper/dashboard')}
                className={`nav-link ${location.pathname.includes('/shopkeeper') ? 'active' : ''}`}
              >
                Redemption History
              </button>
            </>
          )}
        </div>
        <div className="navbar-user">
          <span className="user-name">Welcome, {user.name}</span>
          <span className="user-role">({getRoleDisplayName(user.role)})</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;