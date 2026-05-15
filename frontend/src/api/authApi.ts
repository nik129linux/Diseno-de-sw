import apiClient from './apiClient';

export const authApi = {
  login: async (credentials: any) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  // JWT is stateless — logout is client-side only (clear sessionStorage)
  logout: () => {
    sessionStorage.clear();
  },
  refresh: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },
};
