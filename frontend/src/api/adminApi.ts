import apiClient from './apiClient';

export const adminApi = {
  getStats: async () => {
    const response = await apiClient.get('/audit/stats');
    return response.data;
  },
  getAuditLogs: async (params: any) => {

    const response = await apiClient.get('/audit', { params });
    return response.data;
  },
  getPolicies: async () => {
    const response = await apiClient.get('/policies');
    return response.data;
  },
  updatePolicy: async (id: string, policy: any) => {
    const response = await apiClient.put(`/policies/${id}`, policy);
    return response.data;
  },
  createPolicy: async (policy: any) => {
    const response = await apiClient.post('/policies', policy);
    return response.data;
  },
  deletePolicy: async (id: string) => {
    await apiClient.delete(`/policies/${id}`);
  },
};
