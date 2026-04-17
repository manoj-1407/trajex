import axios from 'axios';

let authStore = null;
const getAuthStore = async () => {
  if (!authStore) {
    const mod = await import('../store/useAuthStore.js');
    authStore = mod.default;
  }
  return authStore;
};

/**
 * Recursively converts a snake_case object into a camelCase object.
 * Essential for 10/10 data consistency from PostgreSQL to Frontend.
 */
function toCamel(obj) {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamel(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/(_[a-z])/g, (get) => get.toUpperCase().replace('_', ''))]: toCamel(obj[key]),
      }),
      {},
    );
  }
  return obj;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const store = await getAuthStore();
  const token = store.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  let csrfMatch = null;
  try {
    csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  } catch (e) {
    // Suppress document.cookie blocked access in strict mobile webviews
  }
  
  if (csrfMatch && csrfMatch[1]) {
    config.headers['X-CSRF-Token'] = csrfMatch[1];
  }

  return config;
});

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => {
    // 10/10 Consistency: Auto-transform all response data to camelCase
    if (res.data) {
      res.data = toCamel(res.data);
    }
    return res;
  },
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url?.includes('/auth/refresh')) {
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
        const baseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1';
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
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
