import axios from 'axios';
import { ApiResponse, User } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('liveconnect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async login(email: string): Promise<{ user: User; token: string }> {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Login failed');
    }
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch user context');
    }
    return res.data.data.user;
  },
};

export const lobbyService = {
  async getOnlineUsers(): Promise<User[]> {
    const res = await api.get<ApiResponse<{ users: User[] }>>('/lobby/users/online');
    return res.data.data?.users || [];
  },

  async getActiveStreams(): Promise<import('../types').StreamRoom[]> {
    const res = await api.get<ApiResponse<{ streams: import('../types').StreamRoom[] }>>('/lobby/streams/active');
    return res.data.data?.streams || [];
  },
};

export default api;
