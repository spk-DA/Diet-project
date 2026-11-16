import axios, { type AxiosAdapter } from 'axios';
import { supabaseAdapter } from './supabaseAdapter';

let useDirectSupabase = false;
const defaultAdapter = axios.getAdapter(['xhr', 'fetch', 'http']);

const hybridAdapter: AxiosAdapter = async (config) => {
  if (useDirectSupabase) {
    return supabaseAdapter(config);
  }

  try {
    const response = await defaultAdapter(config);
    const contentType = String(response.headers?.['content-type'] || '');
    const isHtmlFallback =
      contentType.includes('text/html') ||
      (typeof response.data === 'string' && response.data.trim().startsWith('<!'));

    if (isHtmlFallback) {
      useDirectSupabase = true;
      return supabaseAdapter(config);
    }

    return response;
  } catch (err: any) {
    const status = err?.response?.status;
    const isExpressJson404 =
      status === 404 &&
      typeof err?.response?.data === 'object' &&
      err?.response?.data !== null &&
      'message' in err.response.data;

    // Static hosting (e.g. Shared App URL without Express backend) returns empty/HTML 404 on /api/*
    if (!err?.response || (status === 404 && !isExpressJson404)) {
      useDirectSupabase = true;
      return supabaseAdapter(config);
    }

    throw err;
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: hybridAdapter,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('freshbowl_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    if (
      status === 401 &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/register')
    ) {
      localStorage.removeItem('freshbowl_token');
      window.dispatchEvent(new Event('freshbowl:auth-expired'));
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Request failed. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
