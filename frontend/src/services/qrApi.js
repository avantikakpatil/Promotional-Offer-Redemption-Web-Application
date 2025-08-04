// src/services/qrApi.js
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
  (error) => Promise.reject(error)
);

export const qrAPI = {
  getResellerQRCodes: () => api.get('/reseller/qrcodes'),
};

export default api;
