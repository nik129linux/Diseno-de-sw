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

  getAuditDetail: async (id: string) => {
    const response = await apiClient.get(`/audit/${id}`);
    return response.data;
  },

  exportCsv: async (params: Record<string, any> = {}) => {
    const response = await apiClient.get('/audit/export', {
      params: { format: 'csv', ...params },
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  getUsers: async (params: any = {}) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  getUserList: async (search?: string) => {
    const response = await apiClient.get('/users/list', { params: search ? { search } : {} });
    return response.data;
  },

  getLlmConfig: async () => {
    const response = await apiClient.get('/policies/llm-config');
    return response.data;
  },

  updateLlmConfig: async (config: any) => {
    const response = await apiClient.put('/policies/llm-config', config);
    return response.data;
  },

  getNotificationConfig: async () => {
    const response = await apiClient.get('/notifications/config');
    return response.data;
  },

  updateNotificationConfig: async (config: any) => {
    const response = await apiClient.put('/notifications/config', config);
    return response.data;
  },
};
