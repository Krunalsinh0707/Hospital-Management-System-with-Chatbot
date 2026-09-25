import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, Calendar, Users, ShieldCheck, CheckCircle2, 
  Clock, AlertCircle, Check, X, ArrowRight, Activity, 
  ChevronRight, Stethoscope, User, XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDoctorAppointments, updateAppointmentStatus, getDoctorProfile } from '../../services/hospitalService';
import { getReportsPendingReview } from '../../services/medicalReportsService';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [docData, apps, reps] = await Promise.all([
        getDoctorProfile().catch(() => null),
        getDoctorAppointments().catch(() => []),
        getReportsPendingReview().catch(() => [])
      ]);
      setDoctorProfile(docData);
      setAppointments(apps || []);
      setPendingReports(reps || []);
    } catch (err) {
      console.error('Error fetching doctor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus, notes = '') => {
    setActionLoading(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, newStatus, notes);
      setStatusMessage({
        type: 'success',
        text: `Consultation #${appointmentId} successfully marked as ${newStatus}.`
      });
      await fetchDashboardData();
      if (rejectModalOpen) {
        setRejectModalOpen(false);
        setSelectedApp(null);
        setRejectNotes('');
      }
    } catch (err) {
      console.error('Failed to update consultation status:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to update consultation status.'
      });
    } finally {
      setActionLoading(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const openRejectModal = (app) => {
    setSelectedApp(app);
    setRejectNotes('');
    setRejectModalOpen(true);
  };

  const pendingRequests = appointments.filter(a => a.status === 'REQUESTED');
  const confirmedAppointments = appointments.filter(a => a.status === 'CONFIRMED');
  const uniquePatients = Array.from(new Map(appointments.map(a => [a.patient_id, a])).values());

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Clinical Station Header */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck size={14} /> Clinical Workstation • Verified Practitioner
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Dr. <span className="text-teal-400">{doctorProfile?.full_name || user?.full_name || 'Practitioner'}</span>
            </h1>
            <p className="text-slate-300 text-xs font-medium">
              {doctorProfile?.specialization || 'General Physician'} • {doctorProfile?.department_name || 'Inpatient & Outpatient Care'} 
              {doctorProfile?.license_number ? ` • License #${doctorProfile.license_number}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link 
              to="/doctor/appointments" 
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors"
            >
              Consultations ({appointments.length})
            </Link>
            <Link 
              to="/doctor/reports" 
              className="px-4 py-2.5 bg-[#0F9D8A] hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Activity size={15} />
              <span>Pending Reviews ({pendingReports.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100">✕</button>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border shadow-xs transition-all ${
          pendingRequests.length > 0 ? 'bg-amber-50/50 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Requests</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{pendingRequests.length}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting clinical confirmation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Confirmed Schedule</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F9D8A] flex items-center justify-center font-bold">
              <Calendar size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{confirmedAppointments.length}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Upcoming patient consultations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Reports to Review</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{pendingReports.length}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Diagnostic pre-analyses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Patient Cohort</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{uniquePatients.length}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Under current care roster</p>
        </div>
      </div>

      {/* Main Two-Column Workflow Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Pending Appointment Requests Queue */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Appointment Requests ({pendingRequests.length})
              </h2>
            </div>
            <Link to="/doctor/appointments" className="text-xs font-bold text-[#0F9D8A] hover:underline">
              View All →
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">Loading requests...</p>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-1">
              <CheckCircle2 size={32} className="mx-auto text-teal-600 opacity-60 mb-1" />
              <p className="text-xs font-bold text-slate-700">Triage Queue Clear</p>
              <p className="text-[11px] text-slate-400">All patient consultation requests have been addressed.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingRequests.map((app) => (
                <div key={app.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{app.patient_name}</h4>
                      <span className="text-[10px] font-mono text-slate-400">Ref #{app.id}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      📅 {app.appointment_date} ({app.time_slot || 'Standard Slot'})
                    </p>
                    {app.reason && (
                      <p className="text-[11px] text-slate-700 italic truncate max-w-sm">
                        "{app.reason}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStatusChange(app.id, 'CONFIRMED')}
                      disabled={actionLoading === app.id}
                      className="px-3 py-1.5 bg-[#0F9D8A] hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1"
                    >
                      <Check size={13} />
                      <span>Confirm</span>
                    </button>
                    <button
                      onClick={() => openRejectModal(app)}
                      disabled={actionLoading === app.id}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <X size={13} />
                      <span>Decline</span>
                    </button>
                    <Link
                      to={`/doctor/patients/${app.patient_id}`}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      title="Open Patient EMR"
                    >
                      Chart
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Today's Confirmed Consultations */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Confirmed Consultations ({confirmedAppointments.length})
              </h2>
            </div>
            <Link to="/doctor/appointments" className="text-xs font-bold text-[#0F9D8A] hover:underline">
              Manage All →
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">Loading schedule...</p>
          ) : confirmedAppointments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-1">
              <Calendar size={32} className="mx-auto text-slate-300 mb-1" />
              <p className="text-xs font-bold text-slate-700">No Confirmed Appointments</p>
              <p className="text-[11px] text-slate-400">Confirm incoming patient requests to schedule them here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {confirmedAppointments.slice(0, 5).map((app) => (
                <div key={app.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{app.patient_name}</h4>
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-teal-100 text-teal-800 uppercase">
                        Confirmed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      📅 {app.appointment_date} • {app.time_slot}
                    </p>
                    {app.reason && <p className="text-[11px] text-slate-600 truncate">{app.reason}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStatusChange(app.id, 'COMPLETED', 'Finished')}
                      disabled={actionLoading === app.id}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} />
                      <span>Complete</span>
                    </button>
                    <Link
                      to={`/doctor/patients/${app.patient_id}`}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      Chart
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: AI Decision Support Queue & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending AI Decision Support Queue */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">AI Pre-Analyses Pending Review</h3>
              <p className="text-[11px] text-slate-400">Diagnostic models requiring authorized clinical sign-off</p>
            </div>
            <Link to="/doctor/reports" className="text-xs font-bold text-[#0F9D8A] hover:underline">
              Review Queue →
            </Link>
          </div>

          {pendingReports.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No reports awaiting review.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingReports.slice(0, 4).map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{r.report_title}</h4>
                    <p className="text-[10px] text-slate-400">
                      Patient: <strong className="text-slate-600">{r.patient_name}</strong> • {r.created_at}
                    </p>
                    {r.ai_analysis && (
                      <span className="inline-block text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.2 rounded-md">
                        AI: {r.ai_analysis.prediction} ({r.ai_analysis.risk_level} Risk)
                      </span>
                    )}
                  </div>
                  <Link
                    to="/doctor/reports"
                    className="px-3 py-1.5 bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors shrink-0"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Patients Quick-Access Roster */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Patient Cohort Quick-Access</h3>
              <p className="text-[11px] text-slate-400">Direct access to patient medical histories and digital charts</p>
            </div>
            <Link to="/doctor/appointments" className="text-xs font-bold text-[#0F9D8A] hover:underline">
              All Records →
            </Link>
          </div>

          {uniquePatients.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No patients assigned to your roster yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {uniquePatients.slice(0, 4).map((p) => (
                <div key={p.patient_id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-[#0F9D8A] flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200">
                      {p.patient_name ? p.patient_name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{p.patient_name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {p.patient_mobile || p.patient_email || `ID #${p.patient_id}`}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/doctor/patients/${p.patient_id}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors shrink-0"
                  >
                    Open Chart
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectModalOpen && selectedApp && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-rose-600">
                  <XCircle size={20} />
                  <h3 className="font-extrabold text-sm text-slate-900">Decline Consultation</h3>
                </div>
                <button
                  onClick={() => { setRejectModalOpen(false); setSelectedApp(null); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Declining appointment for <strong>{selectedApp.patient_name}</strong> on {selectedApp.appointment_date}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Decline <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="3"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="e.g. Doctor is in emergency surgery or clinic is full."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setRejectModalOpen(false); setSelectedApp(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedApp.id, 'REJECTED', rejectNotes || 'Doctor unavailable')}
                  disabled={actionLoading === selectedApp.id}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading === selectedApp.id ? 'Processing...' : 'Confirm Decline'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;
