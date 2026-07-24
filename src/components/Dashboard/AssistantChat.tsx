import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, RefreshCw, FileText, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage, ApplicationRecord } from '../../types';
import { SherpaMascot } from '../SherpaMascot';
import { MarkdownMessage } from './MarkdownMessage';

interface AssistantChatProps {
  applications: Record<string, ApplicationRecord>;
  latestCvScore: number | null;
  onNavigate: (tab: 'dashboard' | 'cv' | 'tracker') => void;
  variant?: 'card' | 'panel';
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  applications,
  latestCvScore,
  onNavigate,
  variant = 'card',
}) => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_msg',
      sender: 'assistant',
      text: `Hello ${userProfile?.displayName || 'there'}! I'm Sherpa, your AI career co-pilot. I can help you tailor your resume bullets, find target internships, or prep for upcoming interviews. What would you like to work on today?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsgText = input.trim();
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userProfile,
          applications: Object.values(applications),
          latestCvScore,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || 'Failed to fetch assistant response');
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'I apologize, I encountered an issue processing that. Please try asking again!',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text:
            err?.message && !err.message.includes('fetch')
              ? err.message
              : 'Sorry, I ran into an error connecting to Sherpa AI. Please check your network connection and try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isPanel = variant === 'panel';

  return (
    <div
      className={`w-full bg-white flex flex-col overflow-hidden ${
        isPanel
          ? 'h-full border-0 rounded-none shadow-none'
          : 'border border-gray-200/80 rounded-2xl h-[520px] shadow-sm hover:shadow transition-shadow'
      }`}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <SherpaMascot size="sm" isThinking={loading} />
          <div>
            <span className="text-sm font-semibold text-gray-900 block leading-tight">
              Sherpa Assistant
            </span>
            <span className="text-xs text-gray-500 font-sans leading-tight">
              Personal Career Co-Pilot
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-2 ${isPanel ? 'pr-10' : ''}`}>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-[#FAFAF8]">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {!isUser && (
                <SherpaMascot size="sm" className="shrink-0 mt-0.5" />
              )}

              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-xs shadow-2xs font-medium'
                    : 'bg-white text-gray-800 rounded-tl-xs border border-gray-200/80 shadow-2xs'
                }`}
              >
                <MarkdownMessage text={msg.text} isUser={isUser} />
                <span
                  className={`block text-[10px] mt-1.5 text-right ${
                    isUser ? 'text-blue-100/80' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center">
            <SherpaMascot size="sm" isThinking={true} />
            <div className="bg-white border border-gray-200/80 px-4 py-3 rounded-2xl rounded-tl-xs shadow-2xs text-xs text-gray-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Sherpa is thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="px-4 py-2 border-t border-gray-100 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { label: 'Review my CV', tab: 'cv' as const },
          { label: 'Find top software internships', tab: 'tracker' as const },
          { label: 'How to structure STAR bullets?', action: 'How do I write impactful STAR bullet points for my CV?' },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (item.action) {
                setInput(item.action);
              } else if (item.tab) {
                onNavigate(item.tab);
              }
            }}
            className="px-3 py-1 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-xs text-gray-600 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 font-medium"
          >
            <span>{item.label}</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Sherpa anything about your CV or applications..."
          className="flex-1 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl px-4 py-2.5 outline-none transition-all placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-2xs font-medium shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
