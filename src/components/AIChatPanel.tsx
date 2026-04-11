import React, { useState, useRef, useEffect } from 'react';
import { usePlaylistStore } from '../store';
import { api } from '../services/api';
import './components.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant', 
    content: "Hi! I'm Harmonia AI. What kind of playlist are you looking for? (e.g. 'Chill jazz for studying', 'Upbeat 80s rock', 'Bollywood classics from the 90s')"
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  
  const fetchPlaylists = usePlaylistStore(state => state.fetchPlaylists);

  // Auto-scroll to bottom of chat without scrolling the main page
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: Message = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Call backend Gemini endpoint
      const newPlaylist = await api.chatWithAI(trimmed);
      
      // Update store
      await fetchPlaylists();
      
      // Add success message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Done! I created a new playlist for you called "${newPlaylist.name}" with ${newPlaylist.songs.length} songs. You can find it in your playlists.`
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Oops, something went wrong: ${error.message || 'Failed to generate playlist.'} Please try again.`
      }]);
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
    <div className="ai-chat-panel">
      <div className="chat-header">
        <h2>✨ AI Playlist Generator</h2>
        <p>Powered by Google Gemini</p>
      </div>

      <div className="chat-messages" ref={chatWindowRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message assistant">
             <div className="message-avatar">🤖</div>
             <div className="message-content typing-indicator">
               <span>.</span><span>.</span><span>.</span>
             </div>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the playlist you want..."
          disabled={isLoading}
          rows={2}
        />
        <button 
          onClick={handleSend} 
          disabled={isLoading || !input.trim()}
          className="send-button"
        >
          {isLoading ? '⏳' : 'Generate'}
        </button>
      </div>
    </div>
  );
};
