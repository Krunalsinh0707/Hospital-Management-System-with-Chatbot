import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, History as HistoryIcon, Plus, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';
import ChatHistoryPanel from './ChatHistoryPanel';

const ChatbotDrawer = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! I am HealthBot, your AI healthcare decision support assistant. Ask me anything about your recent lab reports, CBC findings, or physiological risk scores!",
      time: "Just now"
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch conversation sessions when drawer opens
  useEffect(() => {
    if (user && isOpen) {
      fetchConversations();
    }
  }, [user, isOpen]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chatbot/conversations');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  const fetchSessionMessages = async (convId) => {
    setActiveConvId(convId);
    setLoading(true);
    try {
      const res = await api.get(`/chatbot/conversations/${convId}/messages`);
      if (res.data.messages && res.data.messages.length > 0) {
        setMessages(res.data.messages.map(m => ({
          sender: m.sender,
          text: m.message,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      } else {
        setMessages([{
          sender: 'assistant',
          text: "New chat session started. Ask me any question grounded in your lab records!",
          time: "Just now"
        }]);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const res = await api.post('/chatbot/conversations', { title: "New Health Conversation" });
      const newConv = res.data.conversation;
      setActiveConvId(newConv.id);
      setMessages([{
        sender: 'assistant',
        text: "New chat session initialized. How can I assist you with your health records today?",
        time: "Just now"
      }]);
      fetchConversations();
    } catch (err) {
      console.error("Failed to create new session", err);
    }
  };

  const handleDeleteSession = async (convId) => {
    try {
      await api.delete(`/chatbot/conversations/${convId}`);
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([{
          sender: 'assistant',
          text: "Session cleared. Start a new question anytime!",
          time: "Just now"
        }]);
      }
      fetchConversations();
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  const handleSend = async (customText) => {
    const query = customText || inputMsg;
    if (!query.trim()) return;

    const userMessage = { 
      sender: 'user', 
      text: query, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInputMsg('');
    setLoading(true);

    try {
      const payload = { message: query };
      if (activeConvId) {
        payload.conversation_id = activeConvId;
      }

      const response = await api.post('/chatbot/message', payload);

      if (response.data.conversation_id && response.data.conversation_id !== activeConvId) {
        setActiveConvId(response.data.conversation_id);
        fetchConversations();
      }

      const botMessage = {
        sender: 'assistant',
        text: response.data.response,
        time: response.data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Chatbot request error:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.detail 
        ? `API Error: ${err.response.data.detail}`
        : "I experienced a connection issue querying your records. Please try asking again.";
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: errorMsg,
        time: "Just now"
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* FLOATING TRIGGER BUTTON */}
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

      {/* CHAT DRAWER PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="relative w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* DRAWER HEADER */}
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#0F9D8A]">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">HealthBot AI Assistant</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>RAG Clinical Context Active</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Chat History"
                >
                  <HistoryIcon size={18} />
                </button>
                <button
                  onClick={handleNewSession}
                  className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="New Chat"
                >
                  <Plus size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* SAVED HISTORY DRAWER SLIDE-OVER */}
            {showHistory && (
              <ChatHistoryPanel
                conversations={conversations}
                activeId={activeConvId}
                onSelectConv={fetchSessionMessages}
                onNewConv={handleNewSession}
                onDeleteConv={handleDeleteSession}
                onClose={() => setShowHistory(false)}
              />
            )}

            {/* CHAT MESSAGES WINDOW */}
            <ChatWindow messages={messages} loading={loading} />

            {/* SUGGESTED QUESTIONS */}
            <SuggestedQuestions onSelectQuestion={handleSend} />

            {/* INPUT FIELD */}
            <ChatInput 
              inputMsg={inputMsg} 
              setInputMsg={setInputMsg} 
              onSend={handleSend} 
              loading={loading} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatbotDrawer;
