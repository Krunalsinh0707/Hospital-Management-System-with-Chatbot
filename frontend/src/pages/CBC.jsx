import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, UploadCloud, Droplets, Scale, User, ShieldCheck, FileText, Download } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import HealthInfoCard from '../components/HealthInfoCard';
import api from '../services/api';
import { useReports } from '../context/ReportContext';
import ClinicalHeader from '../components/ClinicalHeader';
import ClinicalAdvice from '../components/ClinicalAdvice';
import { useLayout } from '../App';

const fieldConfig = [
  { key: 'Hemoglobin', label: 'Hemoglobin (g/dL)', icon: <Droplets size={18} /> },
  { key: 'RBC', label: 'RBC (M/µL)', icon: <Activity size={18} /> },
  { key: 'WBC', label: 'WBC (K/µL)', icon: <Activity size={18} /> },
  { key: 'Platelets', label: 'Platelets (K/µL)', icon: <Scale size={18} /> },
  { key: 'MCV', label: 'MCV (fL)', icon: <Scale size={18} /> },
  { key: 'MCH', label: 'MCH (pg)', icon: <Scale size={18} /> },
  { key: 'Neutrophils', label: 'Neutrophils (%)', icon: <User size={18} /> },
  { key: 'Lymphocytes', label: 'Lymphocytes (%)', icon: <User size={18} /> },
];

const CBC = () => {
  const { saveReport } = useReports();
  const { toggleSidebar } = useLayout();
  const initialForm = Object.fromEntries(fieldConfig.map(f => [f.key, '']));
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleManualChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null); setFile(null); setError('');
    try {
      const payload = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === '' ? 0 : Number(v)])
      );
      const res = await api.post('/cbc/analyze', payload);
      setResult(res.data);
      await saveReport('cbc', { cbc: res.data?.cbc || {}, interpretation: res.data?.interpretation || {}, source: 'manual' });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Manual analysis failed. Connection unstable.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e?.target?.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true); setResult(null); setError('');
    
    const fd = new FormData();
    fd.append('file', selectedFile);

    try {
      const res = await api.post('/cbc/upload-report', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      await saveReport('cbc', { cbc: res.data?.cbc || {}, interpretation: res.data?.interpretation || {}, source: 'upload' });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Report synthesis failed. Check format.');
    } finally {
      setLoading(false);
    }
  };

  const interpretationData = result?.interpretation || {};
  const cbcValues = result?.cbc || {};
  const hasAnomalies = Object.values(interpretationData).some(v => 
    typeof v === 'string' && (v.toLowerCase().includes('high') || v.toLowerCase().includes('low') || v.toLowerCase().includes('abnormal'))
  );

  return (
    <div className="clinical-page-container">
      <div className="grid grid-cols-12 gap-6">
        <ClinicalHeader 
          title="Hematology (CBC) Analysis" 
          subtitle="Extract and interpret blood parameters via AI" 
          onMenuClick={toggleSidebar}
        />

        {error && (
          <div className="col-span-12 bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-bold">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <div className="col-span-12 lg:col-span-7 space-y-6">
          <FloatingCard padding="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-[#0F9D8A]">
                <UploadCloud size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">Digital Report Intake</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supports PDF, JPG, PNG</p>
              </div>
            </div>
            
            <div className="relative border-2 border-dashed border-teal-100 bg-teal-50/20 rounded-2xl p-10 text-center transition-all hover:bg-teal-50/40 group">
              <input 
                type="file" 
                onChange={handleFileUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-teal-50 flex items-center justify-center mx-auto text-[#0F9D8A] group-hover:scale-110 transition-transform">
                  <FileText size={32} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{file ? file.name : 'Upload Clinical Report'}</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">Automatic parameter extraction powered by Vision-AI</p>
                </div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard padding="p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                <Activity size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Manual Parameter Matrix</h3>
            </div>
            
            <form onSubmit={handleManualAnalyze} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fieldConfig.map((field) => (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {field.label}
                    </label>
                    <HealthInfoCard title={field.key} description="Hematology parameter." />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors">
                      {field.icon}
                    </div>
                    <input
                      type="number"
                      name={field.key}
                      value={formData[field.key]}
                      onChange={handleManualChange}
                      placeholder="---"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-[#0F9D8A] transition-all"
                      required={!file}
                    />
                  </div>
                </div>
              ))}
              
              <div className="col-span-full pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading && !file ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>Analyze Manual Dataset</>
                  )}
                </button>
              </div>
            </form>
          </FloatingCard>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <FloatingCard padding="p-8" className="h-full flex flex-col items-center justify-center text-center">
            {!result && !loading ? (
              <div className="space-y-6 opacity-40">
                <ShieldCheck size={80} className="mx-auto text-slate-200" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-[200px]">
                  Pending report upload or manual vector input
                </p>
              </div>
            ) : loading ? (
              <div className="space-y-6">
                <div className="w-20 h-20 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm font-black text-[#0F9D8A] uppercase tracking-widest animate-pulse">
                  Extracting Clinical Data...
                </p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-6">
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${hasAnomalies ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {hasAnomalies ? 'Anomalies Detected' : 'Physiological Baseline Nominal'}
                  </span>
                </div>
                
                <div className="text-3xl font-black text-slate-800 leading-tight mb-4">
                  Hematology Interpretation
                </div>
                <div className="space-y-4 text-left overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                  {interpretationData.summary && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Clinical Summary</span>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{interpretationData.summary}</p>
                    </div>
                  )}

                  {interpretationData.flags && interpretationData.flags.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[9px] font-black text-slate-400 uppercase ml-1">Abnormal Findings</span>
                      {interpretationData.flags.map((flag, i) => (
                        <div key={i} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-700">{flag}</span>
                          <AlertTriangle size={14} className="text-rose-400" />
                        </div>
                      ))}
                    </div>
                  )}

                  {interpretationData.possible_conditions && interpretationData.possible_conditions.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[9px] font-black text-slate-400 uppercase ml-1">Neural Analysis - Potential Conditions</span>
                      <div className="flex flex-wrap gap-2">
                        {interpretationData.possible_conditions.map((cond, i) => (
                          <div key={i} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-black text-emerald-700 uppercase">
                            {cond}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {interpretationData.ml_model_insights && (
                    <div className="p-4 bg-slate-900 rounded-xl text-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase">AI Confidence Vector</span>
                        <span className="text-[10px] font-black text-teal-400 uppercase">{interpretationData.ml_model_insights.algorithm}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(interpretationData.ml_model_insights.probability || 0) * 100}%` }}
                            className="h-full bg-teal-500"
                          />
                        </div>
                        <span className="text-xs font-black">
                          {((interpretationData.ml_model_insights.probability || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <ClinicalAdvice advice={interpretationData?.clinical_advice} />

                <div className="pt-6 border-t border-slate-50 space-y-3">
                  <button className="w-full bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-[12px] font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/10">
                    <Download size={16} /> Export Detailed PDF
                  </button>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Processed via Hematology Core v1.2
                  </p>
                </div>
              </motion.div>
            )}
          </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default CBC;
