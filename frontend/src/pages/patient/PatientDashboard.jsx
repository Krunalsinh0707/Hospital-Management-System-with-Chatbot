import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, Calendar, AlertOctagon, Heart, Activity, ArrowRight, 
  ShieldCheck, Upload, Layers, Stethoscope, Sparkles, Hospital, Clock,
  Brain, BarChart3, UserCheck, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyReports } from '../../services/medicalReportsService';
import { getMyAppointments } from '../../services/hospitalService';
import AIAnalysisCard from '../../components/AIAnalysisCard';
import HealthcareImage from '../../components/HealthcareImage';

// Image assets
import doctorPatientImg from '../../assets/healthcare/hero/doctor-patient.jpg';
import aiHealthcareImg from '../../assets/healthcare/ai/ai-healthcare.jpg';
import digitalRecordsImg from '../../assets/healthcare/reports/digital-records.jpg';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repData, appData] = await Promise.all([
          getMyReports().catch(() => []),
          getMyAppointments().catch(() => [])
        ]);
        setReports(repData || []);
        setAppointments(appData || []);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const latestReport = reports[0];
  const upcomingAppointment = appointments.find(a => a.status === 'CONFIRMED' || a.status === 'REQUESTED');

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC]">
      {/* ── 1. DASHBOARD HEADER HERO ── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800"
      >
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black uppercase tracking-wider">
              <ShieldCheck size={14} /> HOSPITAL & AI PLATFORM
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Good Morning, <span className="text-teal-400">{user?.full_name || 'Patient'}</span>
            </h1>
            
            <p className="text-slate-300 text-xs md:text-sm max-w-xl leading-relaxed">
              Your Health at a Glance — Manage your medical records, doctor appointments, instant OCR report uploads, and AI decision-support insights.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/own-report')}
                className="px-5 py-3 bg-[#0F9D8A] hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-teal-900/30 flex items-center gap-2"
              >
                <Sparkles size={16} /> I HAVE MY OWN REPORT
              </button>
              
              <Link
                to="/emergency"
                className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-900/30 flex items-center gap-2"
              >
                <AlertOctagon size={16} /> EMERGENCY
              </Link>
            </div>
          </div>

          {/* Right Header Visual */}
          <div className="hidden lg:block">
            <HealthcareImage
              src={doctorPatientImg}
              alt="Medical Care Consultation"
              variant="card"
              aspectRatio="aspect-[16/10]"
              badgeText="Health Command Center"
              badgeSubtext="Active Session"
            />
          </div>
        </div>
      </motion.div>

      {/* ── 2. KEY ENTRY POINT: "I HAVE MY OWN REPORT" ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 hover:border-[#0F9D8A] shadow-md transition-all relative overflow-hidden group"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center font-bold shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <FileText size={30} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0F9D8A] bg-teal-50 px-2.5 py-0.5 rounded">
                KEY ENTRY POINT
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                I HAVE MY OWN REPORT
              </h2>
              <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
                Already have a medical report from another hospital, laboratory, or doctor? Upload it for OCR parameter extraction or enter clinical values manually for instant AI pre-analysis.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/own-report')}
            className="px-6 py-3.5 bg-[#0F9D8A] hover:bg-teal-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-teal-600/20 shrink-0 flex items-center gap-2"
          >
            <span>[ GET STARTED ]</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>

      {/* ── 3. DASHBOARD QUICK ACTIONS GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: 'My Medical Reports', path: '/my-reports', icon: <FileText size={22} className="text-[#0F9D8A]" />, bg: 'bg-teal-50', count: reports.length },
          { title: 'Appointments', path: '/appointments', icon: <Calendar size={22} className="text-indigo-600" />, bg: 'bg-indigo-50', count: appointments.length },
          { title: 'My Doctors', path: '/departments', icon: <UserCheck size={22} className="text-emerald-600" />, bg: 'bg-emerald-50', count: '14+' },
          { title: 'Health Analytics', path: '/history', icon: <BarChart3 size={22} className="text-sky-600" />, bg: 'bg-sky-50', count: 'Live' },
          { title: 'AI Models', path: '/ai-models', icon: <Brain size={22} className="text-purple-600" />, bg: 'bg-purple-50', count: 'Extensible' },
          { title: 'Emergency Care', path: '/emergency', icon: <AlertOctagon size={22} className="text-rose-600" />, bg: 'bg-rose-50', count: '24/7' },
        ].map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#0F9D8A] shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.count}</span>
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight">{item.title}</h3>
              <p className="text-[10px] text-[#0F9D8A] font-bold flex items-center gap-1 mt-1">
                Access <ArrowRight size={10} />
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── 4. REPORT SECTION: HOSPITAL VS EXISTING REPORTS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-[#0F9D8A] uppercase tracking-widest bg-teal-50 px-2.5 py-1 rounded">
              INTERNAL CLINICAL RECORDS
            </span>
            <h3 className="text-lg font-black text-slate-900">HOSPITAL REPORTS</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Medical reports generated directly by Health Analyzer Hospital doctors and diagnostic laboratories.
            </p>
          </div>
          <button
            onClick={() => navigate('/my-reports')}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>[ VIEW REPORTS ]</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded">
              EXTERNAL REPORT OCR
            </span>
            <h3 className="text-lg font-black text-slate-900">EXISTING REPORTS</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Already have a diagnostic report from another lab or hospital? Upload or enter parameters manually for instant AI analysis.
            </p>
          </div>
          <button
            onClick={() => navigate('/own-report')}
            className="w-full py-3 bg-[#0F9D8A] hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>[ UPLOAD REPORT ]</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── 5. MAIN CONTENT GRID: AI INTELLIGENCE & INSIGHTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: AI Pre-Analysis & Recent Records */}
        <div className="lg:col-span-2 space-y-6">
          {latestReport?.ai_analysis ? (
            <div>
              <h2 className="text-base font-black text-slate-900 mb-3 uppercase tracking-tight flex items-center gap-2">
                <Brain size={18} className="text-[#0F9D8A]" />
                Latest Report AI Pre-Analysis
              </h2>
              <AIAnalysisCard analysis={latestReport.ai_analysis} />
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center py-10 shadow-sm space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center mx-auto">
                <FileText size={28} />
              </div>
              <h3 className="text-sm font-black text-slate-800">No AI Pre-Analysis Available Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Upload your medical report or enter clinical values to trigger automated AI pre-analysis and doctor review.
              </p>
              <button
                onClick={() => navigate('/own-report')}
                className="px-5 py-2.5 bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all inline-flex items-center gap-2"
              >
                <span>Upload Report Now</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Recent Records List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <FileText size={18} className="text-[#0F9D8A]" />
                Recent Medical Records
              </h3>
              <Link to="/my-reports" className="text-xs font-bold text-[#0F9D8A] hover:underline flex items-center gap-1">
                View All Records <ArrowRight size={14} />
              </Link>
            </div>

            {reports.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-400">No medical reports registered yet.</p>
                <button 
                  onClick={() => navigate('/own-report')} 
                  className="text-xs font-bold text-[#0F9D8A] hover:underline"
                >
                  Upload your first medical report to begin.
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.slice(0, 4).map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{r.report_title}</h4>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {r.department_name} • {r.report_date} • <span className="uppercase font-bold text-teal-600">{r.report_source}</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 uppercase">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Visual & Doctor Consultation */}
        <div className="space-y-6">
          {/* AI Healthcare Visual Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Brain size={16} className="text-purple-600" />
              AI Intelligence Center
            </h3>
            <HealthcareImage
              src={aiHealthcareImg}
              alt="Healthcare AI Intelligence"
              variant="card"
              aspectRatio="aspect-[16/10]"
              showOverlay={true}
              overlayTitle="14+ AI Decision Support Models"
              overlaySubtitle="Extensible clinical intelligence pipeline"
            />
            <Link
              to="/ai-models"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <span>Browse Available AI Models</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Upcoming Consultation Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Clock size={18} className="text-indigo-600" />
              Upcoming Doctor Consultation
            </h3>

            {upcomingAppointment ? (
              <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F9D8A]">{upcomingAppointment.department_name}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                    {upcomingAppointment.status}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">{upcomingAppointment.doctor_name}</h4>
                <p className="text-xs text-slate-500 font-medium">📅 {upcomingAppointment.appointment_date} ({upcomingAppointment.time_slot})</p>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 space-y-3">
                <p className="text-xs font-medium">No upcoming consultations scheduled.</p>
                <Link to="/appointments" className="inline-block px-4 py-2.5 bg-[#0F9D8A] text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors">
                  Book Doctor Consultation
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
