import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Calendar, FileText, Activity, ShieldCheck, 
  MessageSquare, Send, PlusCircle, AlertTriangle, CheckCircle2, 
  Clock, Heart, Droplets, ChevronLeft, Phone, Mail, Stethoscope
} from 'lucide-react';
import { getPatientClinicalSummary, getConversationWithPatient, sendMessageToPatient, getDoctorProfile } from '../../services/hospitalService';
import { getPatientReports, createHospitalReport } from '../../services/medicalReportsService';
import AIAnalysisCard from '../../components/AIAnalysisCard';
import { useAuth } from '../../context/AuthContext';

const DoctorPatientView = () => {
  const { patientId } = useParams();
  const { user } = useAuth();

  const [patient, setPatient] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports', 'consultations', 'messages', 'new_report'

  // Messaging state
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // New Hospital Report state
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('Laboratory & Clinical Report');
  const [reportFindings, setReportFindings] = useState('');
  const [reportParams, setReportParams] = useState({ glucose: '110', blood_pressure: '120/80' });
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportStatusMsg, setReportStatusMsg] = useState(null);

  useEffect(() => {
    loadAllPatientData();
  }, [patientId]);

  const loadAllPatientData = async () => {
    setLoading(true);
    try {
      const [patData, repData, msgData, docData] = await Promise.all([
        getPatientClinicalSummary(patientId).catch(() => null),
        getPatientReports(patientId).catch(() => []),
        getConversationWithPatient(patientId).catch(() => []),
        getDoctorProfile().catch(() => null)
      ]);

      setPatient(patData);
      setReports(repData || []);
      setMessages(msgData || []);
      setDoctorProfile(docData);
    } catch (err) {
      console.error('Error loading patient chart:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !doctorProfile) return;

    setSendingMessage(true);
    try {
      await sendMessageToPatient({
        doctor_id: doctorProfile.id,
        patient_id: parseInt(patientId),
        message: newMessage.trim()
      });
      setNewMessage('');
      const updatedMessages = await getConversationWithPatient(patientId);
      setMessages(updatedMessages || []);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateHospitalReport = async (e) => {
    e.preventDefault();
    if (!reportTitle || !reportFindings || !doctorProfile) return;

    setSubmittingReport(true);
    setReportStatusMsg(null);
    try {
      await createHospitalReport({
        patient_id: parseInt(patientId),
        department_id: doctorProfile.department_id || 1,
        report_title: reportTitle,
        report_type: reportType,
        findings: reportFindings,
        parameters: reportParams
      });

      setReportStatusMsg({ type: 'success', text: 'Hospital medical report generated and signed successfully.' });
      setReportTitle('');
      setReportFindings('');
      // Reload reports
      const updatedReports = await getPatientReports(patientId);
      setReports(updatedReports || []);
      setTimeout(() => setActiveTab('reports'), 1500);
    } catch (err) {
      console.error('Failed to create hospital report:', err);
      setReportStatusMsg({ type: 'error', text: 'Failed to issue hospital medical report.' });
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-[#0F9D8A] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold text-slate-500">Retrieving patient Electronic Medical Record...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <AlertTriangle size={36} className="text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Patient Chart Not Found</h2>
        <p className="text-xs text-slate-500">Could not locate patient clinical records for ID #{patientId}.</p>
        <Link to="/doctor/appointments" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
          ← Return to Appointments Roster
        </Link>
      </div>
    );
  }

  const profileData = patient.profile_data || {};
  const clinicalInfo = profileData.clinical || {};
  const emergencyInfo = profileData.emergency || {};

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Navigation breadcrumb */}
      <div className="flex items-center justify-between">
        <Link 
          to="/doctor/appointments" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Appointments Roster
        </Link>
        <span className="text-[11px] font-mono text-slate-400">
          EMR UID: #{patient.id} • Registered: {patient.created_at || 'Hospital Database'}
        </span>
      </div>

      {/* Patient Master Demographics Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-[#0F9D8A] flex items-center justify-center font-black text-2xl shrink-0">
              {patient.full_name ? patient.full_name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-900">{patient.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-800 tracking-wider">
                  Blood Group: {patient.blood_group || 'O+'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {patient.role || 'Patient'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 pt-1">
                {patient.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail size={13} className="text-slate-400" /> {patient.email}
                  </span>
                )}
                {patient.mobile_no && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={13} className="text-slate-400" /> {patient.mobile_no}
                  </span>
                )}
                {emergencyInfo.contact_name && (
                  <span className="text-slate-500">
                    Emergency: <strong className="text-slate-700">{emergencyInfo.contact_name}</strong> ({emergencyInfo.contact_phone || 'N/A'})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('new_report')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F9D8A] hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <PlusCircle size={15} />
              <span>Issue Hospital Report</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <MessageSquare size={15} />
              <span>Clinical Chat ({messages.length})</span>
            </button>
          </div>
        </div>

        {/* Clinical Alerts / Chronic Conditions row if recorded */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Known Allergies</span>
            <p className="text-xs font-semibold text-slate-800">{clinicalInfo.allergies || 'No known drug allergies reported'}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Chronic Medical Conditions</span>
            <p className="text-xs font-semibold text-slate-800">{clinicalInfo.chronic_conditions || 'None documented on chart'}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Current Prescribed Medications</span>
            <p className="text-xs font-semibold text-slate-800">{clinicalInfo.current_medications || 'No active routine prescriptions'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'reports', label: 'Medical Reports & AI Analysis', count: reports.length, icon: <FileText size={15} /> },
          { id: 'consultations', label: 'Consultation Roster', count: patient.appointments?.length || 0, icon: <Calendar size={15} /> },
          { id: 'messages', label: 'Clinical Messaging', count: messages.length, icon: <MessageSquare size={15} /> },
          { id: 'new_report', label: 'Issue Official Report', icon: <PlusCircle size={15} /> }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isSelected 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Medical Reports & AI Analysis */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
              <FileText size={40} className="mx-auto mb-2 opacity-30 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700">No Medical Reports on File</h3>
              <p className="text-xs text-slate-400 mt-1">This patient has no uploaded or hospital diagnostic reports yet.</p>
              <button
                onClick={() => setActiveTab('new_report')}
                className="mt-4 px-4 py-2 bg-[#0F9D8A] text-white rounded-xl text-xs font-bold"
              >
                Create First Hospital Report
              </button>
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0F9D8A]">
                        {r.report_source === 'hospital' ? 'Hospital Issued Report' : 'External Diagnostic Upload'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] font-medium text-slate-400">Date: {r.report_date || r.created_at}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{r.report_title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 uppercase tracking-wider">
                      Status: {r.status}
                    </span>
                  </div>
                </div>

                {/* Extracted Lab Parameters if any */}
                {r.extracted_parameters && Object.keys(r.extracted_parameters).length > 0 && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                      Extracted Diagnostic Values
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {Object.entries(r.extracted_parameters).map(([key, val]) => (
                        <div key={key} className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="block text-[9px] uppercase font-bold text-slate-400">{key.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-extrabold text-slate-800">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Pre-Analysis Card */}
                {r.ai_analysis && (
                  <AIAnalysisCard analysis={r.ai_analysis} />
                )}

                {/* Doctor Clinical Review */}
                {r.doctor_review && (
                  <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-[#0F9D8A]" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-teal-900">
                          Finalized Doctor Decision: {r.doctor_review.review_status}
                        </h4>
                      </div>
                      <span className="text-[10px] text-teal-700 font-semibold">{r.doctor_review.reviewed_at}</span>
                    </div>
                    {r.doctor_review.final_assessment && (
                      <p className="text-xs font-bold text-teal-950">
                        Assessment: {r.doctor_review.final_assessment}
                      </p>
                    )}
                    {r.doctor_review.clinical_notes && (
                      <p className="text-xs text-teal-800">
                        Clinical Observation: {r.doctor_review.clinical_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Consultations Roster */}
      {activeTab === 'consultations' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-3">
            Appointment Records with this Patient ({patient.appointments?.length || 0})
          </h3>

          {!patient.appointments || patient.appointments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No consultations recorded with this patient.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {patient.appointments.map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{app.appointment_date}</span>
                      <span className="text-xs text-slate-500">({app.time_slot || 'Standard'})</span>
                    </div>
                    {app.reason && <p className="text-xs text-slate-600">Complaint: {app.reason}</p>}
                    {app.notes && <p className="text-xs text-slate-500 italic">Doctor notes: {app.notes}</p>}
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    app.status === 'CONFIRMED' ? 'bg-teal-100 text-teal-800' :
                    app.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    app.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Clinical Messaging */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#0F9D8A]" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Direct Consultation Thread with {patient.full_name}
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">
              Messages are stored in patient EHR communication audit
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                <MessageSquare size={32} className="opacity-30 mb-2" />
                <p className="text-xs font-semibold">No direct messages yet.</p>
                <p className="text-[10px] text-slate-400">Send clinical instructions, prescription guidance, or follow-up notes below.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.is_me ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.is_me
                        ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <span className="text-[9px] block opacity-70 mb-1 font-bold">
                      {m.is_me ? 'You (Doctor)' : m.sender_name} • {m.created_at}
                    </span>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type clinical instruction or response to patient..."
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0F9D8A]"
            />
            <button
              type="submit"
              disabled={sendingMessage || !newMessage.trim()}
              className="px-4 py-2.5 bg-[#0F9D8A] hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <Send size={13} />
              <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: Issue Hospital Report */}
      {activeTab === 'new_report' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs max-w-2xl space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Issue Official Hospital Diagnostic Report
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft an authorized clinical report with diagnostic parameters. The system will automatically trigger AI cross-validation and attach it to the patient's permanent record.
            </p>
          </div>

          {reportStatusMsg && (
            <div className={`p-3 rounded-xl text-xs font-bold ${
              reportStatusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {reportStatusMsg.text}
            </div>
          )}

          <form onSubmit={handleCreateHospitalReport} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Report Title</label>
              <input
                type="text"
                required
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. Comprehensive Metabolic & Fasting Glucose Evaluation"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Report Category</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0F9D8A]"
                >
                  <option value="Laboratory & Clinical Report">Laboratory & Clinical Report</option>
                  <option value="Cardiology Diagnostics">Cardiology Diagnostics</option>
                  <option value="Endocrine & Diabetes Panel">Endocrine & Diabetes Panel</option>
                  <option value="General Health Evaluation">General Health Evaluation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fasting Glucose (mg/dL)</label>
                <input
                  type="text"
                  value={reportParams.glucose || ''}
                  onChange={(e) => setReportParams({ ...reportParams, glucose: e.target.value })}
                  placeholder="e.g. 110"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0F9D8A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Findings & Medical Impression
              </label>
              <textarea
                rows="4"
                required
                value={reportFindings}
                onChange={(e) => setReportFindings(e.target.value)}
                placeholder="Enter clinical examination notes, diagnostic assessment, patient recommendations, and prescribed plan..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReport}
              className="w-full py-3 bg-[#0F9D8A] hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs disabled:opacity-50"
            >
              {submittingReport ? 'Generating & Signing Report...' : 'Sign and Authorize Official Report'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientView;
