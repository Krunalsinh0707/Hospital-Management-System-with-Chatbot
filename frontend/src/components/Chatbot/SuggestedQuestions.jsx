import React from 'react';
import { Sparkles } from 'lucide-react';

const SuggestedQuestions = ({ onSelectQuestion }) => {
  const prompts = [
    "Explain my latest CBC findings",
    "What is my current diabetes risk level?",
    "Give me tips for lowering blood pressure",
    "Summarize my overall physiological health"
  ];

  return (
    <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
      {prompts.map((prompt, idx) => (
        <button
          key={idx}
          onClick={() => onSelectQuestion(prompt)}
          className="px-3 py-1.5 bg-slate-50 hover:bg-teal-50 hover:text-[#0F9D8A] text-slate-500 rounded-lg text-[10px] font-bold whitespace-nowrap border border-slate-100 transition-all shrink-0 flex items-center gap-1"
        >
          <Sparkles size={10} className="text-[#0F9D8A]" />
          <span>{prompt}</span>
        </button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;
