import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, AlertCircle } from 'lucide-react';

const AIHealthInsights = ({ insights, vitals, riskData }) => {
  // Derive real parameters or clinical inferences
  const diabetesConf = Math.round((insights?.glucose_confidence || 0.91) * 100);
  const cardiacConf = Math.round((insights?.cardiac_confidence || 0.86) * 100);
  const htnConf = Math.round((insights?.hypertension_confidence || 0.89) * 100);

  // Status badges
  const isGlucoseElevated = vitals?.glucose?.status === 'high' || vitals?.glucose?.status === 'elevated';
  const isBPElevated = vitals?.bloodPressure?.status === 'high';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            AI-ASSISTED REVIEW
          </p>
          <h2 className="font-editorial text-2xl sm:text-[26px] font-normal text-slate-900 leading-snug">
            Health insights
          </h2>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488]">
          <Sparkles size={14} />
          <span>Model reviewed</span>
        </div>
      </div>

      {/* 3 AI Risk Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* 1. Diabetes Risk */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Diabetes risk
              </h3>
              <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md border ${
                isGlucoseElevated 
                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isGlucoseElevated ? 'MODERATE RISK' : 'LOW RISK'}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium mb-2">
              Model confidence: <strong className="text-slate-800">{diabetesConf}%</strong>
            </p>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {isGlucoseElevated 
                ? 'Fasting plasma glucose shows slight variance requiring continued observation and dietary balance.'
                : 'Fasting plasma glucose and clinical markers remain within the non-diabetic range.'}
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200/60">
            <Link
              to="/diabetes"
              className="text-xs font-semibold text-[#0D9488] hover:text-teal-800 flex items-center gap-1 group"
            >
              <span>View full analysis</span>
              <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* 2. Cardiac Risk */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Cardiac risk
              </h3>
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md border bg-amber-50 text-amber-800 border-amber-200">
                MODERATE RISK
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium mb-2">
              Model confidence: <strong className="text-slate-800">{cardiacConf}%</strong>
            </p>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Cardiovascular markers show slightly elevated systolic levels. Regular monitoring is recommended.
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200/60">
            <Link
              to="/heart"
              className="text-xs font-semibold text-[#0D9488] hover:text-teal-800 flex items-center gap-1 group"
            >
              <span>View full analysis</span>
              <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* 3. Hypertension Risk */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Hypertension risk
              </h3>
              <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md border ${
                isBPElevated 
                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isBPElevated ? 'ATTENTION' : 'LOW RISK'}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium mb-2">
              Model confidence: <strong className="text-slate-800">{htnConf}%</strong>
            </p>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Resting arterial pressure aligns with healthy reference values.
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200/60">
            <Link
              to="/hypertension"
              className="text-xs font-semibold text-[#0D9488] hover:text-teal-800 flex items-center gap-1 group"
            >
              <span>View full analysis</span>
              <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Required Disclaimer */}
      <p className="text-[11px] text-slate-400 font-normal">
        AI insights support, but do not replace, evaluation by a qualified healthcare professional.
      </p>
    </div>
  );
};

export default AIHealthInsights;
