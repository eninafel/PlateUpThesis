import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PantryItem, MealEntry, UserProfile } from '../types';
import { Send, User, Loader2, RefreshCw, Sparkles, Flame, Utensils } from 'lucide-react';

interface AiChatbotScreenProps {
  pantryItems: PantryItem[];
  todayMeals: MealEntry[];
  userProfile: UserProfile;
}

export const AiChatbotScreen: React.FC<AiChatbotScreenProps> = ({
  pantryItems,
  todayMeals,
  userProfile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! I'm the **PlateUP AI Chatbot** 👨‍🍳🥗.

I help you decide what to cook with whatever ingredients you have in your kitchen, answer recipe questions, suggest ingredient substitutions, and estimate calorie information.

Currently you have **${pantryItems.length} ingredients** recorded in your kitchen and **${todayMeals.reduce((acc, m) => acc + m.calories, 0)} kcal** logged today.

What would you like to make or ask today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState<string>('');
  // null = still checking, otherwise whether the server has a working Gemini key
  const [aiStatus, setAiStatus] = useState<{ aiConnected: boolean; model: string } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setAiStatus({ aiConnected: !!d.aiConnected, model: d.model }))
      .catch(() => setAiStatus({ aiConnected: false, model: '' }));
  }, []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickQuestions = [
    'What meal can I prepare right now?',
    'How many calories are in 2 scrambled eggs?',
    'What can I substitute for butter or oil?',
    'Suggest a fast dinner under 20 minutes',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const todayCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          currentPantry: pantryItems.map((p) => ({ name: p.name, quantity: p.quantity })),
          todaySummary: {
            consumed: todayCalories,
            mealCount: todayMeals.length,
          },
          userGoal: userProfile.dailyCalorieGoal,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (data.offline) setAiStatus((prev) => ({ aiConnected: false, model: prev?.model || '' }));
      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        role: 'assistant',
        content:
          data.reply ||
          (response.ok
            ? "I'm here to help with your meals and cooking questions!"
            : `AI Chatbot error (${response.status}). Please try again.`),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: "Can't reach the PlateUP server. Make sure `npm run dev` is running, then try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat cleared! What ingredient or meal question do you have?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900 text-neutral-100 font-sans select-none">
      {/* Chat Top Header */}
      <div className="p-3.5 bg-neutral-800 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg shadow-sm border border-emerald-500/30">
            👨‍🍳
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white">PlateUP AI Chatbot</h2>
              <span className={`w-1.5 h-1.5 rounded-full ${aiStatus?.aiConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            </div>
            <span className="text-[10px] text-neutral-400">
              {aiStatus === null
                ? 'Checking connection...'
                : aiStatus.aiConnected
                ? `Live AI • ${aiStatus.model}`
                : 'Offline: add GEMINI_API_KEY to enable AI'}
            </span>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Restart Chat"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-lg bg-neutral-800 text-emerald-400 flex items-center justify-center shrink-0 text-xs border border-neutral-700/60">
                  👨‍🍳
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-emerald-500 text-neutral-950 font-medium rounded-br-none shadow-sm'
                    : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-line space-y-1">
                  {m.content.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
                      <strong key={i}>{part.slice(2, -2)}</strong>
                    ) : (
                      <React.Fragment key={i}>{part}</React.Fragment>
                    )
                  )}
                </div>
                <span
                  className={`block text-[9px] mt-1 ${
                    isUser ? 'text-neutral-900/70 text-right' : 'text-neutral-500'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>

              {isUser && (
                <div className="w-6 h-6 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0 text-xs border border-neutral-700">
                  <User size={12} />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2 items-center text-xs text-neutral-400 bg-neutral-800 p-2.5 rounded-2xl w-fit border border-neutral-800">
            <Loader2 size={13} className="animate-spin text-emerald-400" />
            <span>AI Chatbot is typing suggestions...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="p-2 px-3 bg-neutral-800/80 border-t border-neutral-800 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-[10px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-xl whitespace-nowrap border border-neutral-700 transition-colors shrink-0 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-2.5 bg-neutral-800 border-t border-neutral-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Chatbot about recipes, calories, cooking..."
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center disabled:opacity-50 transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
