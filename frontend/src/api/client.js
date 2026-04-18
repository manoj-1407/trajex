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
 * Recursively converts snake_case object keys to camelCase.
 * Handles nested objects and arrays.
 */
function toCamel(obj) {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamel(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/(_[a-z])/g, (g) => g[1].toUpperCase())]: toCamel(obj[key]),
      }),
      {},
    );
  }
  return obj;
}

/**
 * Build the API base URL correctly for all environments.
 * 
 * In production (Vercel): VITE_API_BASE_URL = https://trajex-production.up.railway.app
 *   -> baseURL = https://trajex-production.up.railway.app/api/v1
 *
 * In development (local): No VITE_API_BASE_URL set
 *   -> baseURL = /api/v1  (proxied by Vite to localhost:4000)
 */
function getBaseURL() {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (base) {
    // Strip trailing slash, always append /api/v1
    return base.replace(/\/$/, '') + '/api/v1';
  }
  return '/api/v1';
}

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Required: sends cookies (CSRF, refresh token) cross-origin
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const store = await getAuthStore();
  const token = store.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Read CSRF token from cookie (set by backend on first GET request)
  try {
    const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    if (csrfMatch && csrfMatch[1]) {
      config.headers['X-CSRF-Token'] = csrfMatch[1];
    }
  } catch (e) {
    // Suppress in strict webview environments
  }

  return config;
});

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => {
    // Auto-transform all response data from snake_case to camelCase
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
        const { data } = await axios.post(getBaseURL() + '/auth/refresh', {}, { withCredentials: true });
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
