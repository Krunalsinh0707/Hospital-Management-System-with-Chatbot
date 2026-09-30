import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Edit3, Send } from 'lucide-react';

const MedicalReports = ({ 
  reports = [], 
  onViewReport, 
  onSubmitReportToDoctor 
}) => {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const s = (status || 'UPLOADED').toUpperCase();
    switch (s) {
      case 'FINALIZED':
      case 'APPROVED':
      case 'REVIEWED':
      case 'DOCTOR_REVIEWED':
        return { label: 'FINALIZED', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'PENDING':
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'PENDING_REVIEW':
        return { label: 'PENDING REVIEW', style: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'AI_PRE_ANALYZED':
      case 'OCR_EXTRACTED':
        return { label: 'AI ANALYZED', style: 'bg-[#E8F5F3] text-[#0D9488] border-[#D0ECE7]' };
      case 'UPLOADED':
      default:
        return { label: s, style: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            DOCUMENTS
          </p>
          <h2 className="font-editorial text-2xl sm:text-[26px] font-normal text-slate-900 leading-snug">
            Medical reports
          </h2>
        </div>

        <button
          onClick={() => navigate('/own-report', { state: { mode: 'UPLOAD' } })}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Upload size={13} />
          <span>Upload report</span>
        </button>
      </div>

      {/* Reports List */}
      {reports && reports.length > 0 ? (
        <div className="divide-y divide-slate-100 mb-6">
          {reports.slice(0, 3).map((rep) => {
            const badge = getStatusBadge(rep.status);
            const isDoctorReviewed = rep.status === 'FINALIZED' || rep.status === 'APPROVED' || rep.status === 'DOCTOR_REVIEWED';

            return (
              <div 
                key={rep.id}
                className="py-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* File Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[#E8F5F3] text-[#0D9488] flex items-center justify-center shrink-0 border border-[#D0ECE7]">
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {rep.report_title || 'Diagnostic Clinical Report'}
                      </h4>
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md border ${badge.style}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 truncate">
                      {rep.report_date || 'Recent'} • {rep.department_name || 'General Diagnostics'} • {rep.doctor_name || 'Medical Staff'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => onViewReport(rep)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                  >
                    View
                  </button>

                  {!isDoctorReviewed && (
                    <button
                      onClick={() => onSubmitReportToDoctor(rep)}
                      className="px-2.5 py-1.5 bg-[#E8F5F3] hover:bg-teal-100 text-[#0D9488] text-xs font-semibold rounded-lg border border-[#D0ECE7] transition-all flex items-center gap-1 cursor-pointer"
                      title="Submit report for physician review"
                    >
                      <Send size={11} />
                      <span className="hidden md:inline">Submit to doctor</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-center mb-6">
          <p className="text-xs font-medium text-slate-600 mb-1">
            No medical reports uploaded yet.
          </p>
          <p className="text-[11px] text-slate-400">
            Upload diagnostic laboratory reports to run automated OCR extraction and AI pre-analysis.
          </p>
        </div>
      )}

      {/* Hospital Upload Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
            Have a report from another hospital?
          </h4>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Upload it for AI pre-analysis, OCR/data extraction, and doctor review.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => navigate('/own-report', { state: { mode: 'UPLOAD' } })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Upload size={13} />
            <span>Upload</span>
          </button>
          <button
            onClick={() => navigate('/own-report', { state: { mode: 'MANUAL' } })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <Edit3 size={13} className="text-slate-400" />
            <span>Enter values manually</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalReports;
