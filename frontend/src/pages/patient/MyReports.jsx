import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Plus, Cpu, CheckCircle2, Clock, AlertTriangle, Hospital, FileSpreadsheet, Sparkles, ArrowRight } from 'lucide-react';
import { getMyReports } from '../../services/medicalReportsService';
import AIAnalysisCard from '../../components/AIAnalysisCard';
import { useNavigate } from 'react-router-dom';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, HOSPITAL, UPLOADED
  const [selectedReport, setSelectedReport] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getMyReports();
      setReports(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(r => {
    if (activeTab === 'HOSPITAL') return r.report_source === 'hospital';
    if (activeTab === 'UPLOADED') return r.report_source === 'existing_upload';
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">MY MEDICAL REPORTS</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Access hospital-generated digital records or process existing diagnostic reports from external laboratories.
          </p>
        </div>

        <button
          onClick={() => navigate('/own-report')}
          className="px-5 py-3 bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          <Sparkles size={16} /> I Have My Own Report
        </button>
      </div>

      {/* 2 Major Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* OPTION 1: GET HOSPITAL REPORT */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6 hover:border-[#0F9D8A] transition-all group">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
              <Hospital size={28} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0F9D8A] bg-teal-50 px-2.5 py-0.5 rounded">
                INTERNAL HOSPITAL RECORDS
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">GET HOSPITAL REPORT</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                View diagnostic reports, laboratory panels, and digital records generated internally by doctors and staff at Health Analyzer Hospital.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('HOSPITAL')}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
          >
            [ VIEW HOSPITAL REPORTS ]
          </button>
        </div>

        {/* OPTION 2: ALREADY HAVE A REPORT? -> I HAVE MY OWN REPORT */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6 hover:border-[#0F9D8A] transition-all group">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
              <Upload size={28} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">
                EXTERNAL REPORT ANALYSIS
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">I HAVE MY OWN REPORT</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                Already have a medical report from another hospital, lab, or doctor? Upload your PDF/Image scan or enter manual parameters for department selection & AI pre-analysis.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/own-report')}
            className="w-full py-3.5 bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2"
          >
            <span>[ PROCESS OWN REPORT ]</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Reports History & Listing Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Report History & Records</h3>
            <p className="text-xs text-slate-500">Filter between hospital-generated records and processed external reports.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'HOSPITAL', 'UPLOADED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Report List */}
        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">Loading medical records...</p>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs font-bold">No medical reports found for this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="bg-slate-50/70 hover:bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#0F9D8A] transition-all cursor-pointer shadow-sm space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    report.report_source === 'hospital' ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {report.report_source === 'hospital' ? 'Hospital Generated' : 'External Processed'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{report.report_date}</span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0F9D8A] transition-colors">
                    {report.report_title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{report.department_name}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                    {report.status}
                  </span>
                  <span className="text-xs font-bold text-[#0F9D8A] group-hover:translate-x-1 transition-transform">
                    View Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-[#0F9D8A] uppercase tracking-widest">{selectedReport.department_name}</span>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedReport.report_title}</h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 text-slate-400 hover:text-slate-900 text-sm font-bold">✕</button>
            </div>

            {selectedReport.ai_analysis && (
              <AIAnalysisCard analysis={selectedReport.ai_analysis} />
            )}

            {selectedReport.doctor_review && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Doctor Clinical Assessment</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {selectedReport.doctor_review.review_status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{selectedReport.doctor_review.clinical_notes || selectedReport.doctor_review.final_assessment}</p>
                <p className="text-[10px] text-slate-400">Reviewed: {selectedReport.doctor_review.reviewed_at}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReports;
