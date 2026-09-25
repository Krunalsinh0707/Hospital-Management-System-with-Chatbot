import React from 'react';
import { 
  X, FileText, Calendar, Building, User, CheckCircle2, 
  AlertTriangle, AlertOctagon, ShieldCheck, Download, Activity, 
  FileCheck2, Clock
} from 'lucide-react';

// Clinical reference ranges for extracted lab parameters
const REFERENCE_RANGES = {
  hemoglobin: { min: 13.0, max: 17.0, unit: 'g/dL', label: 'Hemoglobin' },
  glucose: { min: 70, max: 140, unit: 'mg/dL', label: 'Fasting Blood Glucose' },
  blood_pressure: { min: 90, max: 120, unit: 'mmHg', label: 'Systolic Blood Pressure' },
  trestbps: { min: 90, max: 120, unit: 'mmHg', label: 'Resting Blood Pressure' },
  cholesterol: { min: 125, max: 200, unit: 'mg/dL', label: 'Total Cholesterol' },
  chol: { min: 125, max: 200, unit: 'mg/dL', label: 'Serum Cholesterol' },
  rbc: { min: 4.2, max: 5.9, unit: 'M/µL', label: 'Red Blood Cell Count' },
  wbc: { min: 4.0, max: 11.0, unit: 'K/µL', label: 'White Blood Cell Count' },
  platelets: { min: 150, max: 450, unit: 'K/µL', label: 'Platelet Count' },
  mcv: { min: 80, max: 100, unit: 'fL', label: 'Mean Corpuscular Volume (MCV)' },
  mch: { min: 27, max: 33, unit: 'pg', label: 'Mean Corpuscular Hemoglobin (MCH)' },
  insulin: { min: 2.6, max: 24.9, unit: 'µIU/mL', label: 'Fasting Insulin' },
  bmi: { min: 18.5, max: 24.9, unit: 'kg/m²', label: 'Body Mass Index (BMI)' },
  creatinine: { min: 0.6, max: 1.2, unit: 'mg/dL', label: 'Serum Creatinine' },
  heart_rate: { min: 60, max: 100, unit: 'bpm', label: 'Resting Heart Rate' },
  thalach: { min: 60, max: 100, unit: 'bpm', label: 'Max Heart Rate' },
};

const getParameterStatus = (key, rawValue) => {
  const normKey = key.toLowerCase().replace(/[\s-_]/g, '');
  let ref = null;
  for (const [k, v] of Object.entries(REFERENCE_RANGES)) {
    if (normKey === k.toLowerCase() || normKey.includes(k.toLowerCase())) {
      ref = v;
      break;
    }
  }

  const num = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
  if (!ref || isNaN(num)) {
    return {
      label: key.replace(/_/g, ' '),
      value: rawValue,
      unit: '',
      range: 'Clinical standard',
      status: 'Normal',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }

  let status = 'Normal';
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (num < ref.min) {
    status = num < ref.min * 0.8 ? 'Critical' : 'Attention';
    badgeClass = status === 'Critical' 
      ? 'bg-rose-50 text-rose-700 border-rose-200' 
      : 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (num > ref.max) {
    status = num > ref.max * 1.25 ? 'Critical' : 'Attention';
    badgeClass = status === 'Critical' 
      ? 'bg-rose-50 text-rose-700 border-rose-200' 
      : 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return {
    label: ref.label,
    value: num,
    unit: ref.unit,
    range: `${ref.min} – ${ref.max} ${ref.unit}`,
    status,
    badgeClass
  };
};

const ReportDetailModal = ({ report, isOpen, onClose }) => {
  if (!isOpen || !report) return null;

  const rawParams = report.extracted_parameters || report.parameters || {};
  const paramEntries = Object.entries(rawParams);

  // Risk styling
  const riskLevel = report.ai_analysis?.risk_level?.toUpperCase() || 'LOW';
  const riskBadgeColor = 
    riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
    riskLevel === 'MODERATE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full my-8 overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#F8FAFC] px-6 py-4 border-b border-slate-200 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {report.report_source === 'hospital' ? 'Hospital Medical Record' : 'External Diagnostic Panel'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskBadgeColor}`}>
                {riskLevel} RISK
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{report.report_title}</h2>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Building size={13} className="text-slate-400" />
                {report.department_name || 'General Medicine'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" />
                {report.report_date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User size={13} className="text-slate-400" />
                {report.doctor_name || 'Hospital Clinical Staff'}
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Extracted Parameters Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Activity size={16} className="text-[#0F9D8A]" />
                Clinical Parameters & Reference Ranges
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {paramEntries.length} parameter{paramEntries.length === 1 ? '' : 's'} recorded
              </span>
            </div>

            {paramEntries.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-500">
                Diagnostic summary report filed. No individual parameter breakdown extracted.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Parameter</th>
                      <th className="py-2.5 px-4">Measured Value</th>
                      <th className="py-2.5 px-4 hidden sm:table-cell">Reference Range</th>
                      <th className="py-2.5 px-4 text-right">Evaluation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paramEntries.map(([key, val]) => {
                      const parsed = getParameterStatus(key, val);
                      return (
                        <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {parsed.label}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {parsed.value} <span className="text-slate-400 font-normal text-[11px]">{parsed.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 hidden sm:table-cell font-mono text-[11px]">
                            {parsed.range}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${parsed.badgeClass}`}>
                              {parsed.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI Pre-Analysis Section */}
          {report.ai_analysis && (
            <div className="p-4 bg-teal-50/40 border border-teal-100 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                    AI PRE-ANALYSIS
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {report.ai_analysis.model_name || 'Clinical Risk Model'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span>Model Confidence:</span>
                  <span className="text-teal-700">
                    {Math.round((report.ai_analysis.probability || 0.85) * 100)}%
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed font-medium">
                <span className="font-bold text-slate-900">Prediction: </span>
                {report.ai_analysis.prediction}
              </div>

              {report.ai_analysis.explanation && (
                <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-teal-100/70 leading-relaxed">
                  {report.ai_analysis.explanation}
                </p>
              )}

              {report.ai_analysis.important_factors && report.ai_analysis.important_factors.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Key Influencing Factors:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.ai_analysis.important_factors.map((f, i) => (
                      <span key={i} className="text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-teal-100 text-[11px] text-teal-800 font-medium flex items-center gap-1.5">
                <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                <span>AI pre-analysis is for clinical decision-support only and does not replace medical diagnosis.</span>
              </div>
            </div>
          )}

          {/* Doctor Clinical Review Section */}
          {report.doctor_review ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Clinician Review & Sign-Off
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                  {report.doctor_review.review_status || 'APPROVED'}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {report.doctor_review.clinical_notes || report.doctor_review.final_assessment || 'Record approved and filed into patient chart.'}
              </p>
              {report.doctor_review.reviewed_at && (
                <p className="text-[11px] text-slate-400 font-medium">
                  Verified by physician: {report.doctor_review.reviewed_at}
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-medium">
              <Clock size={15} className="shrink-0 text-amber-600" />
              <span>Status: <strong className="uppercase">Awaiting Clinician Review</strong> — Medical staff will verify this report at your next consultation.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#F8FAFC] px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Medical Record ID: #{report.id}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailModal;
