import Axios, { InternalAxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import { authService } from '@/features/auth/auth-service';
import { tokenStore } from '@/features/auth/token-store';

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }

  const token = tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.withCredentials = true;
  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshed = await authService.refresh();
      if (refreshed) {
        const newToken = tokenStore.getAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      }

      // Refresh failed — redirect to login
      window.location.href = '/auth/login';
    }

    return Promise.reject(error);
  },
);
