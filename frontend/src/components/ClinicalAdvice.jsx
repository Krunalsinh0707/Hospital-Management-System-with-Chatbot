import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, Info, Shield, CheckCircle, 
  Activity, Zap, Clock, ShieldAlert, 
  ArrowRight, Heart, FileText, Smartphone
} from 'lucide-react';
import FloatingCard from './FloatingCard';

const ClinicalAdvice = ({ advice }) => {
  if (!advice) return null;

  const {
    risk_summary,
    possible_causes,
    precautions,
    action_plan,
    warning_signs,
    ai_insight
  } = advice;

  const urgencyColors = {
    High: 'text-rose-600 bg-rose-50 border-rose-100',
    Moderate: 'text-amber-600 bg-amber-50 border-amber-100',
    Low: 'text-emerald-600 bg-emerald-50 border-emerald-100'
  };

  return (
    <div className="col-span-12 mt-8 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="h-[2px] flex-grow bg-slate-100"></div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Neural Recommendation Suite
        </h2>
        <div className="h-[2px] flex-grow bg-slate-100"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RISK SUMMARY CARD */}
        <FloatingCard padding="p-6" className="border-l-4 border-l-rose-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-rose-500" size={20} />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">{risk_summary.title}</h3>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${urgencyColors[risk_summary.urgency]}`}>
              {risk_summary.urgency} URGENCY
            </span>
          </div>
          <p className="text-xs font-bold text-slate-600 leading-relaxed mb-4">
            {risk_summary.explanation}
          </p>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 italic">
              "{risk_summary.content}"
            </p>
          </div>
        </FloatingCard>

        {/* POSSIBLE CAUSES CARD */}
        <FloatingCard padding="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="text-slate-400" size={20} />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Contributing Factors</h3>
          </div>
          <div className="space-y-3">
            {possible_causes.map((cause, i) => (
              <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                {cause}
              </div>
            ))}
            {possible_causes.length === 0 && (
              <p className="text-[10px] text-slate-400 italic">No major biometric deviations identified beyond primary condition.</p>
            )}
          </div>
        </FloatingCard>

        {/* PRECAUTIONS CARD */}
        <FloatingCard padding="p-8" className="md:col-span-2">
          <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-50">
            <Shield className="text-[#0F9D8A]" size={24} />
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Preventative Protocol</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} /> Lifestyle Changes
              </h4>
              <ul className="space-y-2">
                {precautions.lifestyle.map((p, i) => (
                  <li key={i} className="text-xs font-bold text-slate-500 flex items-start gap-2">
                    <CheckCircle size={12} className="mt-0.5 text-emerald-400 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} /> Medical Advice
              </h4>
              <ul className="space-y-2">
                {precautions.medical.map((p, i) => (
                  <li key={i} className="text-xs font-bold text-slate-500 flex items-start gap-2">
                    <CheckCircle size={12} className="mt-0.5 text-blue-400 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} /> Restrictions
              </h4>
              <ul className="space-y-2">
                {precautions.avoid.map((p, i) => (
                  <li key={i} className="text-xs font-bold text-slate-500 flex items-start gap-2">
                    <Zap size={12} className="mt-0.5 text-rose-400 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FloatingCard>

        {/* ACTION PLAN CARD */}
        <FloatingCard padding="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-slate-400" size={20} />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Intervention Roadmap</h3>
          </div>
          <div className="space-y-4">
            <div className="relative pl-6 border-l-2 border-slate-100">
              <div className="absolute -left-[5px] top-0 w-2 h-2 bg-rose-400 rounded-full"></div>
              <p className="text-[9px] font-black text-rose-500 uppercase mb-1">Immediate (24-48 hrs)</p>
              <p className="text-xs font-bold text-slate-600">{action_plan.immediate}</p>
            </div>
            <div className="relative pl-6 border-l-2 border-slate-100">
              <div className="absolute -left-[5px] top-0 w-2 h-2 bg-amber-400 rounded-full"></div>
              <p className="text-[9px] font-black text-amber-500 uppercase mb-1">Short-term (1-2 weeks)</p>
              <p className="text-xs font-bold text-slate-600">{action_plan.short_term}</p>
            </div>
            <div className="relative pl-6 border-l-2 border-slate-100">
              <div className="absolute -left-[5px] top-0 w-2 h-2 bg-emerald-400 rounded-full"></div>
              <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Long-term (Sustained)</p>
              <p className="text-xs font-bold text-slate-600">{action_plan.long_term}</p>
            </div>
          </div>
        </FloatingCard>

        {/* WARNING SIGNS CARD */}
        <FloatingCard padding="p-6" className="bg-rose-50/30 border border-rose-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-rose-500" size={20} />
            <h3 className="text-sm font-black uppercase tracking-wider text-rose-600">Red Flag Indicators</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {warning_signs.map((sign, i) => (
              <div key={i} className="px-3 py-2 bg-white border border-rose-100 rounded-lg text-[10px] font-bold text-rose-600 flex items-center gap-2">
                <div className="w-1 h-1 bg-rose-400 rounded-full"></div>
                {sign}
              </div>
            ))}
          </div>
        </FloatingCard>

        {/* AI INSIGHT CARD */}
        <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl">
          <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <Zap className="text-teal-400" size={32} />
          </div>
          <div className="flex-grow">
            <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] mb-2">Neural Decision Insight</h4>
            <p className="text-sm font-bold text-slate-300 leading-relaxed italic">
              "{ai_insight}"
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Model Confidence</span>
            <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-teal-400" style={{ width: '99%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest py-4 italic">
        * This neural analysis is for clinical decision support only. Consult a licensed physician before starting any treatment.
      </p>
    </div>
  );
};

export default ClinicalAdvice;
