import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For physical phone: 'http://192.168.1.10:5000/api'
// For Android emulator: 'http://localhost:5000/api'
const API_BASE_URL = 'http://192.168.1.10:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Add token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('khidmati_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('khidmati_token');
      await AsyncStorage.removeItem('khidmati_user');
      // Navigation will be handled by the component
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ENDPOINTS ============
export const clientLogin = async (email, password) => {
  const response = await api.post('/auth/client/login', { email, password });
  return response.data;
};

export const providerLogin = async (email, password) => {
  const response = await api.post('/auth/provider/login', { email, password });
  return response.data;
};

export const clientRegister = async (userData) => {
  const response = await api.post('/auth/client/register', userData);
  return response.data;
};

export const providerRegister = async (providerData) => {
  const response = await api.post('/auth/provider/register', providerData);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post('/auth/reset-password', { token, password });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

// ============ USER ENDPOINTS ============
export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateCurrentUser = async (userData) => {
  const response = await api.put('/users/me', userData);
  return response.data;
};

export const deleteCurrentUser = async () => {
  const response = await api.delete('/users/me');
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// ============ PROVIDER ENDPOINTS ============
export const getProviders = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const url = params ? `/providers?${params}` : '/providers';
  const response = await api.get(url);
  return response.data;
};

export const getProviderById = async (providerId) => {
  const response = await api.get(`/providers/${providerId}`);
  return response.data;
};

// ============ CATEGORY ENDPOINTS ============
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

// ============ BOOKING ENDPOINTS ============
export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const getBookings = async (status = null) => {
  const url = status ? `/bookings?status=${status}` : '/bookings';
  const response = await api.get(url);
  return response.data;
};

export const getBookingById = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
};

export const confirmBooking = async (bookingId) => {
  const response = await api.patch(`/bookings/${bookingId}/confirm`);
  return response.data;
};

export const setBookingPrice = async (bookingId, price) => {
  const response = await api.patch(`/bookings/${bookingId}/set-price`, { agreed_price: price });
  return response.data;
};

export const cancelBooking = async (bookingId) => {
  const response = await api.patch(`/bookings/${bookingId}/cancel`);
  return response.data;
};

export const scanQRCode = async (bookingId, qrCode) => {
  const response = await api.post(`/bookings/${bookingId}/scan-qr`, { qr_code: qrCode });
  return response.data;
};

export const completeBooking = async (bookingId) => {
  const response = await api.patch(`/bookings/${bookingId}/complete`);
  return response.data;
};

export const submitReview = async (bookingId, rating, comment) => {
  const response = await api.post(`/bookings/${bookingId}/review`, { rating, comment });
  return response.data;
};

export const getAvailableSlots = async (providerId, date) => {
  const response = await api.get(`/bookings/slots?provider_id=${providerId}&date=${date}`);
  return response.data;
};

// ============ MESSAGE ENDPOINTS ============
export const getMessages = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}/messages`);
  return response.data;
};

export const sendMessage = async (bookingId, content) => {
  const response = await api.post(`/bookings/${bookingId}/messages`, { content });
  return response.data;
};

// ============ TOKEN ENDPOINTS ============
export const getTokenBalance = async () => {
  const response = await api.get('/tokens/balance');
  return response.data;
};

export const getTokenHistory = async () => {
  const response = await api.get('/tokens/history');
  return response.data;
};

export const buyTokens = async (amount) => {
  const response = await api.post('/tokens/buy', { amount });
  return response.data;
};

// ============ NOTIFICATION ENDPOINTS ============
export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

// ============ REPORT ENDPOINTS ============
export const createReport = async (reportData) => {
  const response = await api.post('/reports', reportData);
  return response.data;
};

export const getReports = async () => {
  const response = await api.get('/reports');
  return response.data;
};

// ============ ADMIN ENDPOINTS ============
export const getAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getAdminUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const url = params ? `/admin/users?${params}` : '/admin/users';
  const response = await api.get(url);
  return response.data;
};

export const updateUserStatus = async (userId, status) => {
  const response = await api.patch(`/admin/users/${userId}/${status}`);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getAdminReports = async (status = null) => {
  const url = status ? `/admin/reports?status=${status}` : '/admin/reports';
  const response = await api.get(url);
  return response.data;
};

export const updateReport = async (reportId, reportData) => {
  const response = await api.patch(`/admin/reports/${reportId}`, reportData);
  return response.data;
};

export const getAdminBookings = async (status = null) => {
  const url = status ? `/admin/bookings?status=${status}` : '/admin/bookings';
  const response = await api.get(url);
  return response.data;
};

export const forceCompleteBooking = async (bookingId) => {
  const response = await api.patch(`/admin/bookings/${bookingId}/complete`);
  return response.data;
};

export const getTokenStats = async () => {
  const response = await api.get('/admin/tokens');
  return response.data;
};

// ============ UPLOAD ============
export const uploadImage = async (formData) => {
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default api;