import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('edutask_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401, try refreshing the access token once with the stored refresh
// token; if that also fails, clear the session so the app redirects to login.
let isRefreshing = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retry && !isRefreshing) {
      original._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('edutask_refresh_token');

      try {
        if (!refreshToken) throw new Error('no refresh token');
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('edutask_access_token', data.data.accessToken);
        isRefreshing = false;
        return apiClient(original);
      } catch {
        isRefreshing = false;
        localStorage.removeItem('edutask_access_token');
        localStorage.removeItem('edutask_refresh_token');
        localStorage.removeItem('edutask_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = 'Xatolik yuz berdi'): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}
