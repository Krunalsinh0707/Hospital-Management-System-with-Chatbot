import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Copy, Check } from 'lucide-react';

const ChatMessage = ({ msg, onSelectOption }) => {
  const [copied, setCopied] = useState(false);
  const isUser = msg.sender === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text || msg.message || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const textContent = msg.text || msg.message || '';
  const options = msg.clarification_options || [];

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-slate-900 text-white' : 'bg-teal-50 border border-teal-100 text-[#0F9D8A]'}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={`group relative max-w-[85%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed ${isUser ? 'bg-slate-900 text-white rounded-tr-none' : textContent.includes('EMERGENCY') ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-none' : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none'}`}>
        {isUser ? (
          <div className="whitespace-pre-wrap">{textContent}</div>
        ) : (
          <div className="markdown-content space-y-1.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {textContent}
            </ReactMarkdown>
          </div>
        )}

        {/* Interactive Option Buttons if available */}
        {!isUser && options && options.length > 0 && onSelectOption && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSelectOption(`${i + 1}`)}
                className="text-left px-2.5 py-1.5 rounded-lg bg-teal-50/80 hover:bg-teal-100 border border-teal-200 text-teal-900 text-[11px] font-semibold transition-all hover:scale-[1.01]"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 text-[9px] font-bold">
          <span className={isUser ? 'text-slate-400' : 'text-slate-400'}>{msg.time || 'Just now'}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-teal-600 transition-colors flex items-center gap-1 ml-2"
              title="Copy message text"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
