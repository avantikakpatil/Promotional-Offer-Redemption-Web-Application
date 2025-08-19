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

// Campaign API
export const campaignAPI = {
  // Reseller endpoints
  getAvailableCampaigns: () => api.get('/reseller/order/available-campaigns'),
  getCampaignProducts: (campaignId) => api.get(`/reseller/order/campaign/${campaignId}/products`),
  getCampaignDetails: (campaignId) => api.get(`/reseller/order/campaign/${campaignId}/details`),

  // Manufacturer endpoints
  getManufacturerCampaigns: () => api.get('/manufacturer/campaigns'),
  getCampaignById: (id) => api.get(`/manufacturer/campaigns/${id}`),
  createCampaign: (campaignData) => api.post('/manufacturer/campaigns', campaignData),
  updateCampaign: (id, campaignData) => api.put(`/manufacturer/campaigns/${id}`, campaignData),
  deleteCampaign: (id) => api.delete(`/manufacturer/campaigns/${id}`),
  toggleCampaignStatus: (id) => api.patch(`/manufacturer/campaigns/${id}/toggle-status`),
  assignReseller: (campaignId, assignData) => api.post(`/manufacturer/campaigns/${campaignId}/assign-reseller`, assignData),
  getCampaignResellers: (campaignId) => api.get(`/manufacturer/campaigns/${campaignId}/resellers`),
  getCampaignAnalytics: (campaignId) => api.get(`/manufacturer/campaigns/${campaignId}/analytics`),
  getAvailableResellers: () => api.get('/manufacturer/campaigns/available-resellers'),

  // Public endpoint for all campaigns (for reseller dashboard)
  getAllCampaigns: () => api.get('/campaigns'),

  // Reseller participate in campaign
  participateInCampaign: (campaignId) => api.post(`/reseller/campaigns/${campaignId}/participate`),

  // Reseller vouchers
  getResellerVouchers: () => api.get('/reseller/vouchers'),
};

// Manufacturer Product API
export const productAPI = {
  getManufacturerProducts: () => api.get('/manufacturer/product'),
  createProduct: (productData) => api.post('/manufacturer/product', productData),
  updateProduct: (id, productData) => api.put(`/manufacturer/product/${id}`, productData),
};

// Manufacturer Reseller Credentials API
export const manufacturerResellerAPI = {
  createReseller: (data) => api.post('/manufacturer/resellers', data),
  listResellers: () => api.get('/manufacturer/resellers'),
  resetResellerPassword: (id, data) => api.put(`/manufacturer/resellers/${id}/password`, data),
};

export default api;