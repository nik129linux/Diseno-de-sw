import apiClient from './apiClient';

export const promptApi = {
  sendPrompt: async (prompt: string) => {
    const response = await apiClient.post('/prompt', { prompt });
    return response.data;
  },
  testPrompt: async (prompt: string) => {
    const response = await apiClient.post('/prompt/test', { prompt });
    return response.data;
  },
};
