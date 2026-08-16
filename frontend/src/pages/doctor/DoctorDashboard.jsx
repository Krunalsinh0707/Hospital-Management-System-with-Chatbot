import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { FileText, Calendar, Users, Cpu, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDoctorAppointments } from '../../services/hospitalService';
import { getReportsPendingReview } from '../../services/medicalReportsService';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const [apps, reps] = await Promise.all([
        getDoctorAppointments().catch(() => []),
        getReportsPendingReview().catch(() => [])
      ]);
      setAppointments(apps || []);
      setPendingReports(reps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black uppercase tracking-wider mb-3">
              <ShieldCheck size={14} /> Doctor Clinical Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Dr. <span className="text-teal-400">{user?.full_name || 'Practitioner'}</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Review AI pre-analyses, finalize digital medical records, and manage assigned patient consultations.
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/doctor/reports" className="px-5 py-3 bg-[#0F9D8A] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg">
              Pending Reviews ({pendingReports.length})
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reports Pending Review</p>
            <h3 className="text-2xl font-black text-slate-900">{pendingReports.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center font-bold">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Appointments</p>
            <h3 className="text-2xl font-black text-slate-900">{appointments.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Patients</p>
            <h3 className="text-2xl font-black text-slate-900">
              {new Set(appointments.map(a => a.patient_id)).size}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reports Pending Review */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">AI Pre-Analyses Pending Review</h3>
            <Link to="/doctor/reports" className="text-xs font-bold text-[#0F9D8A] hover:underline">Review All →</Link>
          </div>

          {pendingReports.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No medical reports pending doctor review.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingReports.slice(0, 4).map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{r.report_title}</h4>
                    <p className="text-[10px] text-slate-400">Patient: {r.patient_name} • {r.created_at}</p>
                  </div>
                  <Link to="/doctor/reports" className="px-3 py-1.5 bg-teal-50 text-[#0F9D8A] font-bold text-xs rounded-lg">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Consultations */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-3">Consultations</h3>
          {appointments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No assigned appointments scheduled.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.slice(0, 4).map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{app.patient_name}</h4>
                    <p className="text-[10px] text-slate-400">📅 {app.appointment_date} ({app.time_slot})</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
