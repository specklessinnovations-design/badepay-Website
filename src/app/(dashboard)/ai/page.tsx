import React, { useEffect, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';

type Message = {
  role: 'assistant' | 'user';
  content: string;
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am BadePay AI. Ask me about transfers, bills, savings, QR payments, and account support.',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await apiClient.get('/ai/suggestions');
        const list = response?.data?.suggestions || [];
        setSuggestions(list);
      } catch {
        setSuggestions(['Check your recent transactions', 'Scan a QR code to pay', 'Set up automatic savings']);
      }
    };

    void loadSuggestions();
  }, []);

  const handleSend = async (message?: string) => {
    const text = (message || draft).trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setDraft('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/ai/chat', { message: text });
      const answer = response?.data?.response || 'I am here to help with anything related to your BadePay account.';
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'The assistant is temporarily unavailable. Please try again shortly.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="rounded-[28px] border border-white/10 bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--text-secondary)]">AI Assistant</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--text-primary)]">Talk to your BadePay guide</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
              Use the chatbot to get quick help with transfers, bills, savings, and everyday wallet actions.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]">
            <Bot size={28} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/10 bg-[var(--card)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <div className="flex items-center gap-2 px-2 pb-3 text-sm font-semibold text-[var(--text-secondary)]">
            <Sparkles size={16} className="text-[var(--accent)]" />
            Live chat
          </div>

          <div className="space-y-3 rounded-2xl bg-black/10 p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'bg-[var(--accent)] text-[#07110f]'
                      : 'bg-white/10 text-[var(--text-primary)]'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
            className="mt-4 flex gap-2"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask the assistant anything..."
              className="flex-1 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
            />
            <Button type="submit" className="rounded-2xl px-4" disabled={isLoading}>
              <Send size={16} />
            </Button>
          </form>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[var(--card)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <h3 className="text-lg font-black text-[var(--text-primary)]">Popular prompts</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Try one of these starter questions.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                onClick={() => void handleSend(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
