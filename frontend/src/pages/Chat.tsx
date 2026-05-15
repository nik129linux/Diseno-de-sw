import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ShieldAlert, ShieldCheck, MessageSquare, AlertCircle, Trash2 } from 'lucide-react';
import { promptApi } from '../api/promptApi';
import { cn } from '../lib/utils';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sanitizedPrompt?: string;
  blocked?: boolean;
  reasons?: string[];
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setError(null);

    const userMsg: Message = { id: Date.now(), role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Build history: all previous turns as role/content pairs
    const history = messages.flatMap(m => [
      ...(m.role === 'user' ? [{ role: 'user' as const, content: m.content }] : []),
      ...(m.role === 'assistant' && m.content ? [{ role: 'assistant' as const, content: m.content }] : []),
    ]);

    try {
      const data = await promptApi.sendPrompt(userText, history);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.llmResponse ?? '',
        sanitizedPrompt: data.sanitizedPrompt,
        blocked: data.blocked,
        reasons: data.reasons,
      }]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process prompt. Please try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-accent" />
          <h2 className="text-base font-semibold text-foreground">Secure Chat</h2>
          <span className="text-xs text-muted-foreground">— PII is sanitized before reaching the AI</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <MessageSquare size={36} className="opacity-30" />
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className="max-w-[75%] space-y-1.5">

              {/* Blocked banner */}
              {msg.role === 'assistant' && msg.blocked && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  <ShieldAlert size={13} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Prompt blocked</p>
                    <p className="opacity-80">{msg.reasons?.join(', ')}</p>
                  </div>
                </div>
              )}

              {/* Sanitized hint — only when masking changed the original text */}
              {msg.role === 'assistant' && msg.sanitizedPrompt &&
                msg.sanitizedPrompt !== messages[idx - 1]?.content && (
                <p className="text-[10px] text-muted-foreground px-1 font-mono">
                  Sent as: {msg.sanitizedPrompt}
                </p>
              )}

              {/* Bubble */}
              {(msg.role === 'user' || msg.content) && (
                <div className={cn(
                  'px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-sm'
                )}>
                  {msg.content || <span className="italic opacity-60">— prompt was blocked, no response —</span>}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 size={14} className="animate-spin" /> Thinking…
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-border flex-shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm font-mono resize-none outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="flex items-center justify-center h-10 w-10 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground rounded-xl transition-colors flex-shrink-0 glow-accent"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
