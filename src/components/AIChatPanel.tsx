import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Bot, User, Loader2, Send } from 'lucide-react';
import { usePlaylistStore } from '../store';
import { api } from '../services/api';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm Harmonia AI. What kind of playlist are you looking for? (e.g. 'Chill jazz for studying', 'Upbeat 80s rock', 'Bollywood classics from the 90s')",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const fetchPlaylists = usePlaylistStore((s) => s.fetchPlaylists);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setIsLoading(true);
    try {
      const newPlaylist = await api.chatWithAI(trimmed);
      await fetchPlaylists();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Done! I created "${newPlaylist.name}" with ${newPlaylist.songs.length} songs. You'll find it in your library.`,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Something went wrong: ${error.message || 'Failed to generate playlist.'} Please try again.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[60vh] max-h-[560px] flex-col">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
          <Sparkles size={18} className="text-accent-ink" /> AI Playlist Generator
        </h2>
        <p className="mt-0.5 text-xs text-muted">Powered by Google Gemini</p>
      </div>

      <div ref={chatWindowRef} className="flex flex-1 flex-col gap-3.5 overflow-y-auto py-2 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex max-w-[88%] gap-2.5', msg.role === 'user' ? 'flex-row-reverse self-end' : 'self-start')}
          >
            <span
              className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-full border',
                msg.role === 'assistant'
                  ? 'border-transparent bg-accent text-accent-contrast'
                  : 'border-line bg-surface text-ink-soft'
              )}
            >
              {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
            </span>
            <div
              className={cn(
                'rounded-md border px-3.5 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'border-line bg-paper-2 text-ink'
                  : 'border-line bg-surface text-ink'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex max-w-[88%] gap-2.5 self-start">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-accent-contrast">
              <Bot size={16} />
            </span>
            <div className="flex items-center rounded-md border border-line bg-surface px-3.5 py-2.5">
              <Loader2 size={16} className="animate-spin text-muted" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2.5 border-t border-line pt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the playlist you want…"
          disabled={isLoading}
          rows={2}
          className="flex-1 resize-none rounded border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="flex items-center gap-1.5 rounded bg-accent px-4 text-sm font-medium text-accent-contrast transition-[filter] hover:brightness-95 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} /> Generate</>}
        </button>
      </div>
    </div>
  );
};
