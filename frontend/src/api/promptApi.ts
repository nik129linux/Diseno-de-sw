import apiClient from './apiClient';

let _conversationId: string | null = null;

/** Returns the UUID for the current chat session, generating it on first call. */
export function getConversationId(): string {
  if (!_conversationId) {
    _conversationId = crypto.randomUUID();
  }
  return _conversationId;
}

/** Call this when the user starts a new conversation. */
export function resetConversationId(): void {
  _conversationId = crypto.randomUUID();
}

export const promptApi = {
  sendPrompt: async (prompt: string, history?: { role: string; content: string }[]) => {
    const response = await apiClient.post('/chat/prompt', {
      prompt,
      conversationId: getConversationId(),
      history,
    });
    return response.data;
  },

  getHistory: async (page = 0, size = 20) => {
    const response = await apiClient.get('/chat/history', { params: { page, size } });
    return response.data;
  },
};
