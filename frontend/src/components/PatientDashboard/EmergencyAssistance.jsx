import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle } from 'lucide-react';

const EmergencyAssistance = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FEF2F2] border border-red-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs mb-6">
      {/* Overline with Icon */}
      <div className="flex items-center gap-1.5 mb-2">
        <AlertCircle size={14} className="text-red-600" />
        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
          EMERGENCY ASSISTANCE
        </p>
      </div>

      {/* Title */}
      <h2 className="font-editorial text-xl sm:text-2xl font-normal text-slate-900 leading-snug mb-2">
        Get urgent help now
      </h2>

      {/* Description */}
      <p className="text-xs text-slate-600 leading-relaxed font-normal">
        For chest discomfort, sudden shortness of breath, fainting, or another medical emergency, request immediate triage.
      </p>

      {/* 24h Triage Note */}
      <p className="text-[11px] text-slate-400 font-normal mt-2.5">
        Hospital emergency triage is staffed 24 hours daily.
      </p>

      {/* Action Button */}
      <button
        onClick={() => navigate('/emergency')}
        className="w-full mt-4 py-2.5 bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <AlertTriangle size={14} />
        <span>Emergency assistance</span>
      </button>
    </div>
  );
};

export default EmergencyAssistance;
