import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Plus, Stethoscope, Sparkles, AlertCircle,
  Clock, ShieldAlert, CheckCircle2, ChevronRight, User, RefreshCw, Info, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clinicalChatService from '../../services/clinicalChatService';

const SUGGESTED_QUERIES = [
  "Can you explain the key findings in my latest CBC blood report?",
  "I am having mild headaches and fatigue for the past 2 days.",
  "What diet and hydration adjustments are recommended for high blood pressure?",
  "How should I manage my blood sugar readings if they are fluctuating?"
];

export default function PatientChatPage() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  const messagesEndRef = useRef(null);

  // Fetch patient conversations
  const fetchConversations = async () => {
    setLoadingList(true);
    try {
      const data = await clinicalChatService.getMyConversations();
      setConversations(data || []);
      if (!selectedConvId && data && data.length > 0) {
        setSelectedConvId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load patient consultations", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch selected conversation messages
  const fetchMessages = async (id) => {
    setLoadingDetail(true);
    try {
      const data = await clinicalChatService.getConversation(id);
      setSelectedConv(data);
      setMessages(data.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error("Failed to load consultation messages", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId]);

  // Periodic silent refresh for doctor replies
  useEffect(() => {
    if (!selectedConvId) return;
    const interval = setInterval(() => {
      clinicalChatService.getConversation(selectedConvId).then(data => {
        setSelectedConv(data);
        setMessages(data.messages || []);
      }).catch(e => console.error("Silent refresh error", e));
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedConvId]);

  // Create new consultation
  const handleStartNewConsultation = async () => {
    try {
      const newConv = await clinicalChatService.createConversation({
        title: "New Health Consultation"
      });
      await fetchConversations();
      setSelectedConvId(newConv.id);
      setSidebarOpenMobile(false);
    } catch (err) {
      console.error("Error creating consultation", err);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || sendingMessage) return;

    setSendingMessage(true);
    setInputText('');

    try {
      let convId = selectedConvId;
      if (!convId) {
        const newConv = await clinicalChatService.createConversation({
          title: text.substring(0, 35) + "...",
          initial_message: text
        });
        await fetchConversations();
        setSelectedConvId(newConv.id);
        return;
      }

      await clinicalChatService.sendMessage(convId, text);
      await fetchMessages(convId);
      await fetchConversations();
    } catch (err) {
      console.error("Failed to deliver message", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status, escalationStatus) => {
    if (escalationStatus === 'PENDING_ACK' || status === 'ESCALATED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          Awaiting Clinical Triage
        </span>
      );
    } else if (status === 'DOCTOR_RESPONDED') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={13} />
          Doctor Responded
        </span>
      );
    } else if (status === 'RESOLVED') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <CheckCircle2 size={13} />
          Consultation Concluded
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
          <Clock size={13} />
          Active Consultation
        </span>
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-1rem)] bg-[#F8FAFC] text-slate-800 p-3 md:p-6 overflow-hidden">
      {/* Top Life-Safety Emergency Banner */}
      <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-3 md:px-5 md:py-3.5 mb-4 shadow-xs">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="text-xs text-rose-900 leading-relaxed">
            <span className="font-bold">Medical Emergency Notice: </span>
            If you are experiencing acute chest pain, shortness of breath, sudden facial drooping or numbness, severe bleeding, or loss of consciousness,
            please immediately call <span className="font-extrabold underline">911 / 112 / 108</span> or go to the nearest emergency trauma room.
            This chat is for informational triage and clinical decision support.
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0">

        {/* Left Column: Patient Consultation History (4 Cols) */}
        <div className={`md:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-full ${
          sidebarOpenMobile ? 'fixed inset-0 z-40 m-4' : 'hidden md:flex'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Your Consultations</h2>
              <p className="text-[11px] text-slate-500">History of your health discussions</p>
            </div>
            <button
              onClick={handleStartNewConsultation}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-cyan-500/20 transition-all"
            >
              <Plus size={14} />
              New Chat
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingList ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw size={18} className="animate-spin text-cyan-600" />
                Loading consultation history...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <MessageSquare size={26} className="text-slate-300" />
                No consultations yet. Click "New Chat" to begin!
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === selectedConvId;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedConvId(c.id);
                      setSidebarOpenMobile(false);
                    }}
                    className={`p-3.5 cursor-pointer transition-all border-l-4 ${
                      isSelected
                        ? 'bg-cyan-50/60 border-l-cyan-600 shadow-xs'
                        : 'border-l-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-semibold text-xs text-slate-900 line-clamp-1">{c.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Case #{c.id}</span>
                      {getStatusBadge(c.status, c.escalation_status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Chat Stream & Composer (8 Cols) */}
        <div className="md:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-full">

          {/* Chat Workspace Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpenMobile(true)}
                className="md:hidden p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedConv ? selectedConv.title : "HealthBot Clinical Assistant"}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>AI Triage & Clinician Consultation</span>
                  {selectedConv && (
                    <>
                      <span>•</span>
                      {getStatusBadge(selectedConv.status, selectedConv.escalation_status)}
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => selectedConvId && fetchMessages(selectedConvId)}
              className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-white rounded-lg transition-colors"
              title="Refresh Messages"
            >
              <RefreshCw size={15} className={loadingDetail ? 'animate-spin text-cyan-600' : ''} />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/30">
            {loadingDetail ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw size={20} className="animate-spin text-cyan-600" />
                Loading conversation messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mx-auto">
                  <Stethoscope size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Start Your Consultation</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Type your symptoms, lab questions, or medical concerns below.
                  Our clinical assistant provides immediate guidance and routes urgent matters directly to attending hospital physicians.
                </p>

                {/* Suggested Queries */}
                <div className="pt-2 text-left space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Questions:</span>
                  {SUGGESTED_QUERIES.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(q)}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-cyan-400 hover:bg-cyan-50/40 text-xs text-slate-700 transition-all block"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isPatient = m.sender_type === 'patient';
                const isDoctor = m.sender_type === 'doctor';
                const isAssistant = m.sender_type === 'assistant';

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1 px-1">
                      {isDoctor && (
                        <span className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          <Stethoscope size={11} />
                          {m.sender_name}
                        </span>
                      )}
                      {isAssistant && (
                        <span className="flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          <Sparkles size={11} />
                          HealthBot AI Assistant
                        </span>
                      )}
                      {isPatient && (
                        <span className="text-slate-500">You</span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs leading-relaxed whitespace-pre-wrap ${
                        isPatient
                          ? 'bg-cyan-600 text-white font-medium rounded-tr-xs shadow-cyan-600/10'
                          : isDoctor
                          ? 'bg-blue-50 border border-blue-200 text-blue-950 font-medium rounded-tl-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="p-3.5 border-t border-slate-200 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about lab results, symptoms, or consultation advice..."
                className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={sendingMessage || !inputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white font-semibold text-xs hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
              >
                <Send size={14} />
                {sendingMessage ? 'Processing...' : 'Send'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
