import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, Heart as HeartIcon, User, Scale, Zap, Users, ShieldCheck, Download, Eye } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import HealthInfoCard from '../components/HealthInfoCard';
import api from '../services/api';
import { useReports } from '../context/ReportContext';
import ClinicalHeader from '../components/ClinicalHeader';
import ClinicalAdvice from '../components/ClinicalAdvice';
import { useLayout } from '../App';

const iconsMap = {
  age: <User size={18} />, sex: <User size={18} />, bmi: <Scale size={18} />,
  heart_rate: <HeartIcon size={18} />, activity_level: <Activity size={18} />,
  smoker: <Zap size={18} />, family_history: <Users size={18} />
};

const Hypertension = () => {
  const { reports, saveReport, loading: reportsLoading } = useReports();
  const { toggleSidebar } = useLayout();
  const [formData, setFormData] = useState({
    age: '', sex: '', bmi: '', heart_rate: '', 
    activity_level: '', smoker: '', family_history: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const payload = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === '' ? 0 : Number(v)])
      );
      const res = await api.post('/predict/hypertension', payload);
      setResult(res.data);
      await saveReport('hypertension', {
        ...payload,
        prediction: res.data?.prediction || 'Unknown',
        probability: res.data?.ml_model_insights?.probability || 0
      });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Analysis failed. Connection unstable.');
    } finally {
      setLoading(false);
    }
  };

  const isHighRisk = result?.raw === 1;
  const htnProb = result?.ml_model_insights?.probability || 0;
  const hyperHistory = reports.filter(r => r.type === 'hypertension').slice(0, 5);

  return (
    <div className="clinical-page-container">
      <div className="grid grid-cols-12 gap-6">
        <ClinicalHeader 
          title="Hypertension AI Analysis" 
          subtitle="Predictive engine for vascular risk assessment" 
          onMenuClick={toggleSidebar}
        />

        {error && (
          <div className="col-span-12 bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-bold">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <div className="col-span-12 lg:col-span-7">
          <FloatingCard padding="p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-[#0F9D8A]">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Vascular Risk Matrix</h3>
            </div>
            
            <form onSubmit={handlePredict} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(formData).map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </label>
                    <HealthInfoCard title={key.toUpperCase()} description="Clinical marker for hypertension risk." />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors">
                      {iconsMap[key]}
                    </div>
                    <input
                      type="number"
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      placeholder="---"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-[#0F9D8A] transition-all"
                      required
                    />
                  </div>
                </div>
              ))}
              
              <div className="col-span-full pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0F9D8A] hover:bg-[#0D8A79] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>Run Hypertension Analysis</>
                  )}
                </button>
              </div>
            </form>
          </FloatingCard>

          <div className="mt-6 clinical-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Vascular Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Analysis ID</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Finding</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Confidence</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {hyperHistory.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 text-xs font-bold text-slate-600">#HT-{h.id}</td>
                      <td className="px-6 py-3">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${h.prediction.toLowerCase().includes('high') ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {h.prediction}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs font-bold text-slate-400">{((h.probability || 0.9) * 100).toFixed(1)}%</td>
                      <td className="px-6 py-3 text-right">
                        <button className="text-[10px] font-black text-[#0F9D8A] uppercase hover:underline flex items-center gap-1 ml-auto">
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <FloatingCard padding="p-8" className="h-full flex flex-col items-center justify-center text-center sticky top-24">
            {!result && !loading ? (
              <div className="space-y-6 opacity-40">
                <ShieldCheck size={80} className="mx-auto text-slate-200" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-[200px]">
                  Pending vascular biometrics for neural processing
                </p>
              </div>
            ) : loading ? (
              <div className="space-y-6">
                <div className="w-20 h-20 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm font-black text-[#0F9D8A] uppercase tracking-widest animate-pulse">
                  Analyzing Probability Vector...
                </p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Result</span>
                </div>
                
                <div className="space-y-2">
                  <div className={`text-4xl font-black ${isHighRisk ? 'text-rose-500' : 'text-emerald-500'} leading-tight`}>
                    {result?.prediction || 'Low Risk'}
                  </div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Model Confidence: {(htnProb * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[11px] font-black text-slate-400 uppercase">Risk Probability</span>
                    <span className="text-xl font-black text-slate-800">{(htnProb * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${htnProb * 100}%` }}
                      className={`h-full ${isHighRisk ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Influence Factors</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {result?.ml_model_insights?.top_features?.map((f, i) => (
                      <span key={i} className="px-3 py-1 bg-teal-50 text-[#0F9D8A] text-[10px] font-black uppercase rounded-lg border border-teal-100">
                        {f.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <ClinicalAdvice advice={result?.clinical_advice} />

                <div className="pt-6 border-t border-slate-50">
                  <button className="w-full bg-slate-900 hover:bg-black text-white text-[12px] font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                    <Download size={16} /> Download Report
                  </button>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-3 italic">
                    *Neural assessment for clinical decision support only
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

export default Hypertension;
