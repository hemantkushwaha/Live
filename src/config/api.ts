import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { CLIENT_CONFIG } from './config';
import { Logger } from '../utils/logger';

export const apiClient: AxiosInstance = axios.create({
  baseURL: CLIENT_CONFIG.apiBaseUrl,
  timeout: CLIENT_CONFIG.timeouts.API_REQUEST_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (Logging / Request preparation)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined'
      ? (sessionStorage.getItem('liveconnect_session_token') || localStorage.getItem('liveconnect_session_token'))
      : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    Logger.debug('API-Client', `Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    Logger.error('API-Client', 'Request configuration error', error);
    return Promise.reject(error);
  }
);

// Response Interceptor (Error normalization)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    Logger.debug('API-Client', `Response [${response.status}]: ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string; errorCode?: string } | undefined;
    const errorMessage = data?.message || error.message || 'Network request failed';

    Logger.error('API-Client', `HTTP ${status || 'ERR'} on ${error.config?.url}: ${errorMessage}`, data);
    return Promise.reject(error);
  }
);
