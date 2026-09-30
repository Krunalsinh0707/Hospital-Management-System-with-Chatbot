import React from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ inputMsg, setInputMsg, onSend, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSend();
  };

  return (
    <div className="p-3 bg-white border-t border-slate-100">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Ask HealthBot..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#0F9D8A] focus:ring-2 focus:ring-teal-500/10 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !inputMsg.trim()}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
