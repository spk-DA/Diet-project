import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
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
