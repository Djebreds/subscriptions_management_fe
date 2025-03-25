import axios from 'axios';
import { refreshToken } from './auth';

let isRefreshing = false;
let failedQueue: any[] = [];

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('access') : null;

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        console.log('OAI OAI');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;

          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshToken();

        localStorage.setItem('access', newAccessToken);

        api.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${newAccessToken}`;

        failedQueue.forEach((prom) => prom.resolve(newAccessToken));
        failedQueue = [];

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach((prom) => prom.reject(refreshError));
        failedQueue = [];

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
