import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handler
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Log the error for debugging
    console.log(`API Error: ${error.config?.method?.toUpperCase()} ${url} → ${status}`);

    // Only clear credentials on 401 (invalid/expired token)
    // Do NOT clear on 403 (role-based access denied — token is still valid)
    // Do NOT clear on login/register endpoints (wrong password is not a token issue)
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      console.log('Token expired or invalid — clearing stored credentials');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);
export default axiosInstance;
