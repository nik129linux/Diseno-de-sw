import React, { useState } from 'react';
import { Send, Loader2, ShieldAlert, ShieldCheck, MessageSquare } from 'lucide-react';
import { promptApi } from '../api/promptApi';

interface PromptResponse {
  sanitizedPrompt: string;
  llmResponse: string;
  blocked: boolean;
  reasons: string[];
}

const Chat: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<PromptResponse | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResponse(null);
    try {
      const data = await promptApi.sendPrompt(input);
      setResponse(data);
    } catch (error) {
      console.error('Error sending prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#001f3f] text-white overflow-hidden">
      {/* Input Pane */}
      <div className="w-1/2 h-full border-r border-blue-900 flex flex-col p-6 space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="text-blue-400" />
          <h2 className="text-xl font-semibold">Prompt Input</h2>
        </div>
        
        <textarea
          className="flex-1 w-full p-4 bg-[#002b55] border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
          placeholder="Enter your prompt here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
          <span>{isLoading ? 'Processing...' : 'Send Prompt'}</span>
        </button>
      </div>

      {/* Output Pane */}
      <div className="w-1/2 h-full flex flex-col overflow-y-auto p-6 space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <ShieldCheck className="text-blue-400" />
          <h2 className="text-xl font-semibold">AI Response</h2>
        </div>

        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-[#002b55] rounded-lg w-full"></div>
            <div className="h-48 bg-[#002b55] rounded-lg w-full"></div>
          </div>
        )}

        {!isLoading && !response && (
          <div className="flex flex-col items-center justify-center h-full text-blue-300 opacity-50">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p>Send a prompt to see the result</p>
          </div>
        )}

        {response && (
          <div className="space-y-6">
            {response.blocked && (
              <div className="p-4 bg-red-900/40 border border-red-600 rounded-lg flex space-x-3 text-red-200">
                <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-bold mb-1">Prompt Blocked</p>
                  <ul className="list-disc list-inside text-sm opacity-90">
                    {response.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">Sanitized Prompt</label>
              <div className="p-4 bg-[#002b55] border border-blue-700 rounded-lg font-mono text-sm whitespace-pre-wrap">
                {response.sanitizedPrompt}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">LLM Response</label>
              <div className="p-4 bg-[#001a3a] border border-blue-800 rounded-lg leading-relaxed">
                {response.llmResponse}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
