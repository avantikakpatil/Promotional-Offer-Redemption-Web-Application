// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5162/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
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

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/user/profile'),
};

// Offers API
export const offersAPI = {
  getOffers: () => api.get('/offer'),
  getOffer: (id) => api.get(`/offer/${id}`),
  createOffer: (offerData) => api.post('/offer', offerData),
  updateOffer: (id, offerData) => api.put(`/offer/${id}`, offerData),
  deleteOffer: (id) => api.delete(`/offer/${id}`),
  redeemOffer: (id) => api.post(`/offer/${id}/redeem`),
  getMyOffers: () => api.get('/offer/my-offers'),
  getMyRedemptions: () => api.get('/offer/my-redemptions'),
};

export default api;