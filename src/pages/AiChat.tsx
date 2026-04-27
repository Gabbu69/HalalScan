import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { askHalalAssistant } from '../utils/geminiApi';
import { Bot, Send, User } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AiChat() {
  const { madhab } = useAppStore();
  const { t } = useTranslation();
  const isGeneral = madhab === 'General';
  
  const initialGreeting = isGeneral
    ? (t('chat.welcome_general') || "Hello! I am Scan AI. How can I assist you with analyzing products for animal-derived ingredients, hidden pork, or alcohol today?")
    : (t('chat.welcome') || "Assalamu alaikum! I am HalalScan AI. How can I help you regarding Halal food, ingredients, or Islamic jurisprudence today?");

  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1',
    role: 'assistant',
    content: initialGreeting
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // When madhab or language changes, reset chat
  React.useEffect(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: initialGreeting
    }]);
  }, [madhab, isGeneral, initialGreeting]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await askHalalAssistant(userMessage.content, madhab);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please check your API key or try again later."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full mx-auto max-w-md w-full pt-4 font-nunito bg-[#F9F5F0] dark:bg-[var(--color-dark-bg)]">
      <div className="px-5 mb-2 border-b border-gray-200 dark:border-gray-800 pb-3 flex flex-row items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-[#1B6B3A] border-2 border-[#C9A84C] rounded-full flex items-center justify-center shadow-md">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-amiri italic text-xl text-[#1B6B3A] dark:text-green-400 font-bold leading-tight">
            {t('chat.title') || (isGeneral ? "Scan AI" : "Ask Imam AI")}
          </h2>
          <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">Powered by Gemini</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-row ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#1B6B3A] text-white rounded-br-none' 
                : 'bg-white dark:bg-[#1a2e22] text-[#1a1a1a] dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-800'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex flex-row justify-start">
            <div className="max-w-[85%] rounded-2xl p-4 shadow-sm bg-white dark:bg-[#1a2e22] text-[#1a1a1a] dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-800">
               <div className="flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-[#1B6B3A] dark:bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#1B6B3A] dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-[#1B6B3A] dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-[#1a2e22] border-t border-gray-200 dark:border-gray-800 shrink-0">
        <form onSubmit={handleSend} className="flex flex-row items-center gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-3 rounded-full bg-[#F9F5F0] dark:bg-[#0f1a13] text-[#1a1a1a] dark:text-white text-sm focus:outline-none border border-gray-200 dark:border-gray-700"
            placeholder={t('chat.placeholder') || (isGeneral ? "E.g. Is carmine vegan?" : "E.g. Is cochineal allowed?")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-full bg-[#C9A84C] hover:bg-[#b59642] flex items-center justify-center text-[#1B6B3A] disabled:opacity-50 transition-colors shadow-md"
          >
            <Send size={18} className="translate-x-[1px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
