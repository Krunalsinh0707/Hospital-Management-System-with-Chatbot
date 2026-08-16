import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, AlertTriangle, ShieldCheck, CheckCircle2, Clock, FileText, ArrowRight, UserCheck } from 'lucide-react';

const AIPreAnalysisResult = ({ analysis, extractedParameters, departmentName, onDone }) => {
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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl space-y-6 max-w-3xl mx-auto"
    >
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center font-bold shadow-inner">
            <Cpu size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0F9D8A] bg-teal-50 px-2.5 py-0.5 rounded">
                AI PRE-ANALYSIS
              </span>
              <span className="text-xs font-bold text-slate-400">
                {departmentName || analysis.department_slug || 'General'}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              {analysis.prediction || 'AI Risk Pre-Analysis'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-black px-3 py-1.5 rounded-full border uppercase ${getRiskBadge(analysis.risk_level)}`}>
            {analysis.risk_level || 'LOW'} RISK
          </span>
          <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 uppercase flex items-center gap-1">
            <Clock size={12} /> DOCTOR REVIEW: PENDING
          </span>
        </div>
      </div>

      {/* Model & Probability Bar */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500">Model: {analysis.model_name || 'Medical Intelligence Engine'} (v{analysis.model_version || '1.0'})</span>
          <span className="text-slate-900 font-extrabold">{probPercent}% Probability Confidence</span>
        </div>

        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              probPercent > 70 ? 'bg-rose-500' : probPercent > 40 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${probPercent}%` }}
          />
        </div>
      </div>

      {/* Key Factors Identified */}
      {analysis.important_factors && analysis.important_factors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Important Risk Factors Identified</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analysis.important_factors.map((factor, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs font-bold text-slate-800 bg-teal-50/50 p-3 rounded-xl border border-teal-100/60">
                <span className="w-2 h-2 rounded-full bg-[#0F9D8A] mt-1.5 shrink-0" />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Explanation */}
      {analysis.explanation && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">AI Clinical Support Explanation</h4>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {analysis.explanation}
          </p>
        </div>
      )}

      {/* Extracted Parameters Preview if present */}
      {extractedParameters && Object.keys(extractedParameters).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Validated Parameter Data</h4>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(extractedParameters).map(([k, v]) => (
                <div key={k} className="bg-white p-2 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">{k}</span>
                  <span className="font-extrabold text-slate-900">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3 text-amber-800 text-xs font-medium leading-relaxed">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider block text-[10px] text-amber-900 mb-0.5">Medical Disclaimer</span>
          This AI analysis is intended for decision support and informational purposes. It does not replace professional medical evaluation or diagnosis.
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <ShieldCheck size={16} className="text-[#0F9D8A]" />
          <span>Routed to Hospital Doctor Review Queue</span>
        </div>

        {onDone && (
          <button
            onClick={onDone}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <span>Back to Medical Reports</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default AIPreAnalysisResult;
