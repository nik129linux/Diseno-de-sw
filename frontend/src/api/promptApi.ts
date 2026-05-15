import apiClient from './apiClient';

export const promptApi = {
  sendPrompt: async (prompt: string) => {
    const response = await apiClient.post('/prompt/sanitize', { prompt });
    return response.data;
  },
};
