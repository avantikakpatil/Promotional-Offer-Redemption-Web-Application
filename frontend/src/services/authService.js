// src/services/authService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5162/api';

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
authAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Register new user
  signup: async (userData) => {
    try {
      const response = await authAPI.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await authAPI.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Google authentication
  googleSignIn: async (userData) => {
    try {
      const response = await authAPI.post('/auth/google', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Google authentication failed' };
    }
  },

  // Google Sign Up
  googleSignUp: async (userData) => {
    try {
      const response = await authAPI.post('/auth/google/signup', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Google sign up failed' };
    }
  },

  // Get available roles
  getRoles: async () => {
    try {
      const response = await authAPI.get('/auth/roles');
      return response.data.roles;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch roles' };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is logged in
  isLoggedIn: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('token');
  }
};