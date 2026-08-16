import React from 'react';
import { Cpu, AlertTriangle, CheckCircle, AlertOctagon, Info } from 'lucide-react';

const AIAnalysisCard = ({ analysis, onSendDoctorReview }) => {
  if (!analysis) return null;

  const getRiskBadge = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const probPercent = Math.round((analysis.probability || 0.5) * 100);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F9D8A]">
            <Cpu size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0F9D8A] bg-teal-50 px-2 py-0.5 rounded">
                AI PRE-ANALYSIS
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {analysis.model_name || 'Neural Risk Engine'} v{analysis.model_version || '1.0'}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              {analysis.prediction || 'Pre-Analysis Result'}
            </h3>
          </div>
        </div>

        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getRiskBadge(analysis.risk_level)}`}>
          {analysis.risk_level || 'LOW'} RISK
        </span>
      </div>

      <div className="space-y-4 my-4">
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
            <span>Risk Probability Confidence</span>
            <span>{probPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                probPercent > 70 ? 'bg-rose-500' : probPercent > 40 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${probPercent}%` }}
            />
          </div>
        </div>

        {analysis.important_factors && analysis.important_factors.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Diagnostic Factors Identified</h4>
            <ul className="space-y-1.5">
              {analysis.important_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F9D8A] mt-1.5 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.explanation && (
          <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100/60 text-xs text-slate-700 leading-relaxed">
            {analysis.explanation}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200/60">
          <AlertTriangle size={15} className="shrink-0" />
          <span>This AI analysis is clinical decision-support and does not replace authorized doctor diagnosis.</span>
        </div>

        {onSendDoctorReview && (
          <button
            onClick={onSendDoctorReview}
            className="px-4 py-2 bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-600/10"
          >
            Send for Doctor Review
          </button>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisCard;
