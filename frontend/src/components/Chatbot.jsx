import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Chatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am HealthBot, your AI healthcare assistant. Ask me anything about your recent lab reports, physiological risk scores, or health recommendations!",
      time: "Just now"
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Don't render chatbot for unauthenticated guests
  if (!user) return null;

  const handleSend = async (textToSend) => {
    const query = textToSend || inputMsg;
    if (!query.trim()) return;

    const userMessage = { sender: 'user', text: query, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputMsg('');
    setLoading(true);

    try {
      const response = await api.post('/chatbot/message', { message: query });
      const botMessage = {
        sender: 'bot',
        text: response.data.response,
        time: response.data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "I experienced a connection issue syncing your records. Please try asking again.",
        time: "Just now",
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Explain my latest CBC findings",
    "What is my current diabetes risk level?",
    "Give me tips for lowering blood pressure"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 1. FLOATING CHAT BUTTON */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 hover:bg-slate-800 transition-all border border-slate-700"
        >
          <div className="relative">
            <Bot size={24} className="text-[#0F9D8A]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Ask HealthBot</span>
        </motion.button>
      )}

      {/* 2. CHAT DRAWER PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* PANEL HEADER */}
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#0F9D8A]">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">HealthBot AI Assistant</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>Connected to Patient File</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* MESSAGE HISTORY LIST */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-teal-50 border border-teal-100 text-[#0F9D8A]'}`}>
                    {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs font-medium ${msg.sender === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : msg.text.includes('EMERGENCY') ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-none' : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none'}`}>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    <span className={`block text-[9px] mt-1.5 font-bold uppercase ${msg.sender === 'user' ? 'text-slate-400 text-right' : 'text-slate-400'}`}>{msg.time}</span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold p-2">
                  <RefreshCw size={14} className="animate-spin text-[#0F9D8A]" />
                  <span>Analyzing clinical context...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* QUICK PROMPTS */}
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-teal-50 hover:text-[#0F9D8A] text-slate-500 rounded-lg text-[10px] font-bold whitespace-nowrap border border-slate-100 transition-all shrink-0"
                >
                  <Sparkles size={10} className="inline mr-1 text-[#0F9D8A]" />
                  {prompt}
                </button>
              ))}
            </div>

            {/* INPUT FOOTER */}
            <div className="p-3 bg-white border-t border-slate-100">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Ask about your vitals, CBC, or risks..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#0F9D8A] focus:ring-2 focus:ring-teal-500/10 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMsg.trim()}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
