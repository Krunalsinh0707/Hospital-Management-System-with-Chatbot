import React from 'react';
import { RefreshCw } from 'lucide-react';

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold p-3 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm">
      <RefreshCw size={14} className="animate-spin text-[#0F9D8A]" />
      <span>Analyzing clinical context & reports...</span>
    </div>
  );
};

export default TypingIndicator;
