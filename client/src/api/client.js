import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('day90_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login with message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const code = err.response?.data?.code;
      if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID') {
        localStorage.removeItem('day90_token');
        localStorage.removeItem('day90_user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ─────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/api/auth/signup', data),
  login:  (data) => api.post('/api/auth/login', data),
  demo:   ()     => api.post('/api/auth/demo'),
  me:     ()     => api.get('/api/auth/me'),
};

// ── Routines ─────────────────────────────────────────────
export const routineAPI = {
  create:     (data)        => api.post('/api/routines', data),
  current:    ()            => api.get('/api/routines/current'),
  checkIn:    (id, data)    => api.post(`/api/routines/${id}/checkin`, data),
  weekly:     (id, data)    => api.post(`/api/routines/${id}/weekly`, data),
  progress:   (id)          => api.get(`/api/routines/${id}/progress`),
  verdict:    (id)          => api.get(`/api/routines/${id}/verdict`),
  summary:    (id)          => api.get(`/api/routines/${id}/summary`),
  update:     (id, data)    => api.patch(`/api/routines/${id}`, data),
};

// ── AI ───────────────────────────────────────────────────
export const aiAPI = {
  ask:              (data) => api.post('/api/ai/ask', data),
  weeklyReflection: (data) => api.post('/api/ai/weekly-reflection', data),
};

// ── Timeline ─────────────────────────────────────────────
export const timelineAPI = {
  get: (category) => api.get(`/api/timeline/${category}`),
};

// ── Account ──────────────────────────────────────────────
export const accountAPI = {
  delete: () => api.delete('/api/account'),
};
