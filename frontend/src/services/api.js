import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is due to an expired token
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const detail = error.response.data?.detail || '';
      if (typeof detail === 'string' && (detail.includes('Signature has expired') || detail.includes('Could not validate credentials'))) {
        // Clear local storage and force user to log in again
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
