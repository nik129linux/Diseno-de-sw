import React, { useState } from 'react';
import { Send, Loader2, ShieldAlert, ShieldCheck, MessageSquare, AlertCircle } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResponse(null);
    setError(null);
    try {
      const data = await promptApi.sendPrompt(input);
      setResponse(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Input pane */}
      <div className="w-1/2 h-full border-r border-border flex flex-col p-6 gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-accent" />
          <h2 className="text-base font-semibold text-foreground">Prompt Input</h2>
        </div>

        <textarea
          id="chat-prompt"
          aria-label="Enter your prompt"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Enter your prompt here… (Enter to send, Shift+Enter for new line)"
          className="flex-1 w-full p-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm font-mono resize-none outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
        />

        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="flex items-center justify-center gap-2 h-9 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground px-5 rounded-lg text-sm font-medium transition-colors glow-accent"
        >
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {isLoading ? 'Processing…' : 'Send Prompt'}
        </button>
      </div>

      {/* Output pane */}
      <div className="w-1/2 h-full flex flex-col overflow-y-auto p-6 gap-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-accent" />
          <h2 className="text-base font-semibold text-foreground">AI Response</h2>
        </div>

        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-40 bg-muted rounded-lg" />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {!isLoading && !response && !error && (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground gap-2">
            <MessageSquare size={36} className="opacity-30" />
            <p className="text-sm">Send a prompt to see the result</p>
          </div>
        )}

        {response && (
          <div className="space-y-4">
            {response.blocked && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm mb-1">Prompt Blocked</p>
                  <ul className="list-disc list-inside text-xs space-y-0.5 opacity-80">
                    {response.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Sanitized Prompt</p>
              <div className="p-3 rounded-lg bg-secondary border border-border font-mono text-sm whitespace-pre-wrap text-foreground">
                {response.sanitizedPrompt}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">LLM Response</p>
              <div className="p-3 rounded-lg bg-card border border-border text-sm leading-relaxed text-foreground">
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
