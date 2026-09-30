import React, { useState } from 'react';
import { X, Send, ShieldCheck, AlertCircle, CheckCircle2, User, Building } from 'lucide-react';
import { submitReportForReview } from '../../services/medicalReportsService';

const SubmitReportModal = ({ 
  isOpen, 
  onClose, 
  report, 
  doctors = [], 
  departments = [], 
  onSubmitted 
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState(report?.doctor_id || '');
  const [selectedDeptId, setSelectedDeptId] = useState(report?.department_id || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen || !report) return null;

  // Filter doctors by selected department if any
  const availableDoctors = selectedDeptId 
    ? doctors.filter(d => String(d.department_id) === String(selectedDeptId))
    : doctors;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setError("Please select a physician to review your medical report.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await submitReportForReview(report.id, Number(selectedDoctorId), notes);
      setSuccessResult(res);
      if (onSubmitted) {
        onSubmitted(res);
      }
    } catch (err) {
      console.error("Failed to submit report for review:", err);
      const detail = err.response?.data?.detail || err.message || "Failed to submit report. Please try again.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccessResult(null);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8F5F3] text-[#0D9488] flex items-center justify-center">
              <Send size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Submit Report to Physician
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Clinical review request
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        {successResult ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Report Submitted Successfully
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                {successResult.message || `Your report '${report.report_title}' has been dispatched to the clinician for review.`}
              </p>
              <div className="inline-block mt-3 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E8F5F3] text-[#0D9488] border border-[#D0ECE7]">
                STATUS: {successResult.already_pending ? 'PENDING' : 'SUBMITTED'}
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={handleClose}
                className="px-5 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Selected Report Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Selected Medical Report
              </span>
              <p className="text-xs font-bold text-slate-900">
                {report.report_title}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {report.report_date} • {report.department_name || 'General Diagnostics'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Department Filter (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hospital Department
              </label>
              <select
                value={selectedDeptId}
                onChange={e => {
                  setSelectedDeptId(e.target.value);
                  setSelectedDoctorId('');
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0D9488]"
              >
                <option value="">All Clinical Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Attending Physician <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0D9488]"
              >
                <option value="">Choose a physician...</option>
                {availableDoctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.full_name?.startsWith('Dr.') ? doc.full_name : `Dr. ${doc.full_name}`} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Clinical Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Message / Symptoms for Physician <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Describe any symptoms, medication changes, or specific questions for the physician..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0D9488] resize-none"
              />
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2 text-[11px] text-slate-500 pt-1">
              <ShieldCheck size={14} className="text-[#0D9488] shrink-0 mt-0.5" />
              <span>
                Your doctor will review this diagnostic report in their clinical console and update your care notes.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-60 cursor-pointer"
              >
                <Send size={13} />
                <span>{loading ? 'Submitting...' : 'Submit for Review'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubmitReportModal;
