import apiClient from './apiClient';

export const authApi = {
  login: async (credentials: any) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      sessionStorage.clear();
    }
  },
  refresh: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },
};
