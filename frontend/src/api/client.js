import axios from 'axios';

let authStore = null;
const getAuthStore = async () => {
  if (!authStore) {
    const mod = await import('../store/useAuthStore.js');
    authStore = mod.default;
  }
  return authStore;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const store = await getAuthStore();
  const token = store.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  if (csrfMatch && csrfMatch[1]) {
    config.headers['X-CSRF-Token'] = csrfMatch[1];
  }

  return config;
});

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        const store = await getAuthStore();
        store.getState().setToken(data.accessToken);
        queue.forEach((p) => p.resolve(data.accessToken));
        queue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        queue.forEach((p) => p.reject(new Error('Session expired')));
        queue = [];
        const store = await getAuthStore();
        store.getState().logout();
        window.location.replace('/login');
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
