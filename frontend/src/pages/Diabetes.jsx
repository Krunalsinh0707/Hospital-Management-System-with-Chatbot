import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, Heart, Droplets, Scale, User, ShieldCheck, Zap, Download } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import HealthInfoCard from '../components/HealthInfoCard';
import api from '../services/api';
import { useReports } from '../context/ReportContext';
import ClinicalHeader from '../components/ClinicalHeader';
import ClinicalAdvice from '../components/ClinicalAdvice';
import { useLayout } from '../App';

const iconsMap = {
  Glucose: <Activity size={18} />,
  BloodPressure: <Heart size={18} />,
  SkinThickness: <Droplets size={18} />,
  Insulin: <Activity size={18} />,
  BMI: <Scale size={18} />,
  DiabetesPedigreeFunction: <Zap size={18} />,
  Age: <User size={18} />
};

const Diabetes = () => {
  const { saveReport } = useReports();
  const { toggleSidebar } = useLayout();
  const [formData, setFormData] = useState({
    Glucose: '', BloodPressure: '', SkinThickness: '',
    Insulin: '', BMI: '', DiabetesPedigreeFunction: '', Age: ''
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
      const res = await api.post('/predict', payload);
      setResult(res.data);
      await saveReport('diabetes', { inputs: payload, outputs: res.data, source: 'manual' });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Analysis failed. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  const isPositive = result?.diabetes_prediction === 'Positive';
  const probability = result?.ml_model_insights?.probability || 0;

  return (
    <div className="clinical-page-container">
      <div className="grid grid-cols-12 gap-6">
        <ClinicalHeader 
          title="Diabetes Vector Analysis" 
          subtitle="Neural inference for metabolic health" 
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
              <h3 className="text-xl font-bold text-slate-800">Biometric Input Matrix</h3>
            </div>
            
            <form onSubmit={handlePredict} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(formData).map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <HealthInfoCard title={key} description="Clinical parameter for diabetes prediction." />
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
                      placeholder="Enter value..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-[#0F9D8A] transition-all"
                      required
                    />
                  </div>
                </div>
              ))}
              
              <div className="col-span-1 md:col-span-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0F9D8A] hover:bg-[#0D8A79] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>Run Clinical Inference Engine</>
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
                  Pending biometric input for neural analysis
                </p>
              </div>
            ) : loading ? (
              <div className="space-y-6">
                <div className="w-20 h-20 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm font-black text-[#0F9D8A] uppercase tracking-widest animate-pulse">
                  Synthesizing clinical data...
                </p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prediction Results</span>
                </div>
                
                <div className="space-y-2">
                  <div className={`text-5xl font-black ${isPositive ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {isPositive ? 'Positive' : 'Negative'}
                  </div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Risk Assessment: {result.risk_level}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[11px] font-black text-slate-400 uppercase">Model Confidence</span>
                    <span className="text-xl font-black text-slate-800">{(probability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${probability * 100}%` }}
                      className={`h-full ${isPositive ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100/50">
                    <span className="block text-[9px] font-black text-teal-600 uppercase mb-1">Algorithm</span>
                    <span className="text-[12px] font-bold text-teal-800 truncate block">Random Forest 2.0</span>
                  </div>
                  <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100/50">
                    <span className="block text-[9px] font-black text-purple-600 uppercase mb-1">Analysis ID</span>
                    <span className="text-[12px] font-bold text-purple-800">#DH-{Math.floor(Math.random()*9000)+1000}</span>
                  </div>
                </div>

                <ClinicalAdvice advice={result?.clinical_advice} />

                <button className="w-full flex items-center justify-center gap-2 text-[12px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-colors">
                  <Download size={14} /> Download Clinical Report
                </button>
              </motion.div>
            )}
          </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default Diabetes;
