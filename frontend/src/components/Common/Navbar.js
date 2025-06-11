// src/components/Common/Navbar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null; // Don't show navbar on login/signup pages
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Promotional Offers</h1>
      </div>
      <div className="navbar-menu">
        <div className="navbar-user">
          <span className="user-name">Welcome, {user.name}</span>
          <span className="user-role">({user.role})</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;