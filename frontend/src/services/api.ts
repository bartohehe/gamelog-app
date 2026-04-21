import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('gamelog_auth');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { /* ignore */ }
  }
  return config;
});

export default api;