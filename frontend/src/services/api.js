import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    const path = window.location.pathname;
    const isLoginPage = path === '/patient/login' || path === '/doctor/login' || path === '/admin/login' || path === '/login' || path === '/';
    if (!isLoginPage) {
      if (path.startsWith('/doctor')) {
        window.location.replace('/doctor/login');
      } else if (path.startsWith('/admin')) {
        window.location.replace('/admin/login');
      } else {
        window.location.replace('/patient/login');
      }
    }
  }
  return Promise.reject(error);
});

export default api;
