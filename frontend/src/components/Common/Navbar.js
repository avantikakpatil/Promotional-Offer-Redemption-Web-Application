// src/components/Common/Navbar.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api'; // Import the API service
import './Navbar.css';


const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // To check if the user is a reseller

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (user && user.role === 'reseller') {
      fetchNotifications();
    }
  }, [user, location.pathname]); // Re-fetch when user or path changes

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reseller/notification');
      setNotifications(response.data.items || response.data);
      setTotalCount(response.data.totalCount || response.data.length);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/reseller/notification/mark-as-read');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  // Debug: Log user to check if present
  console.log('[Navbar] user:', user);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>B2B Promotional Offers</h1>
      </div>
      <div className="navbar-menu">
        {user && user.role === 'reseller' && (
          <div className="notification-container">
            <button onClick={toggleNotifications} className="notification-icon">
              🔔 {totalCount > 0 && <span className="notification-badge">{totalCount}</span>}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <h3 className="dropdown-title">Notifications ({totalCount})</h3>
                <button onClick={markAllAsRead} className="mark-read-button">Mark all as read</button>
                {loading ? (
                  <p>Loading notifications...</p>
                ) : (
                  <ul className="notification-list">
                    {notifications.length === 0 ? (
                      <p className="no-notifications">No notifications to display.</p>
                    ) : (
                      notifications.map(notification => (
                        <li key={notification.id} className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}>
                          <p>{notification.message}</p>
                          <span className="timestamp">{new Date(notification.createdAt).toLocaleString()}</span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
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