import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, FileText, Cpu, Layers, RefreshCw, CheckCircle, 
  AlertTriangle, Database, Zap, Download, ShieldCheck, Eye, Activity
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import FloatingCard from '../components/FloatingCard';
import ClinicalHeader from '../components/ClinicalHeader';
import { useLayout } from '../App';

const MLStudio = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useLayout();
  const [mlFile, setMlFile] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlResults, setMlResults] = useState(null);
  const [mlError, setMlError] = useState(null);
  const fileRef = useRef(null);

  const handleMLFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setMlFile(file);
      setMlError(null);
    } else {
      setMlError("Please select a valid .csv clinical dataset");
    }
  };

  const handleMLTrain = async () => {
    if (!mlFile) return;
    setMlLoading(true);
    setMlError(null);
    setMlResults(null);

    const formData = new FormData();
    formData.append('file', mlFile);

    try {
      const data = await dashboardService.trainCustomML(formData);
      setMlResults(data);
    } catch (err) {
      setMlError(err.response?.data?.detail || "Training failed. Ensure CSV format is correct.");
    } finally {
      setMlLoading(false);
    }
  };

  const downloadResultsAsJSON = () => {
    if (!mlResults) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mlResults, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `model_results_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="clinical-page-container">
      <div className="grid grid-cols-12 gap-6">
        <ClinicalHeader 
          title="Clinical ML Training Studio" 
          subtitle="Advanced neural optimization and model evaluation" 
          onMenuClick={toggleSidebar}
        />

        {!user && (
          <div className="col-span-12 bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3 text-amber-700 text-sm font-bold shadow-sm">
            <AlertTriangle size={18} />
            <span>GUEST MODE: Training sessions are volatile. <Link to="/login" className="underline hover:text-amber-900 transition-colors">Sign in</Link> to persist models.</span>
          </div>
        )}

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <FloatingCard padding="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-[#0F9D8A]">
                <Upload size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Dataset Intake</h3>
            </div>

            <div 
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group ${mlFile ? 'border-[#0F9D8A] bg-teal-50/20' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'}`}
              onClick={() => fileRef.current.click()}
            >
              <input 
                type="file" 
                ref={fileRef}
                onChange={handleMLFileChange}
                accept=".csv"
                className="hidden" 
              />
              <div className="space-y-4">
                <div className={`w-16 h-16 rounded-2xl shadow-sm border flex items-center justify-center mx-auto transition-transform group-hover:scale-110 ${mlFile ? 'bg-white border-teal-100 text-[#0F9D8A]' : 'bg-white border-slate-100 text-slate-400'}`}>
                  {mlFile ? <FileText size={32} /> : <Upload size={32} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{mlFile ? mlFile.name : 'Click to Upload CSV'}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Supervised Learning Mode</p>
                </div>
              </div>
            </div>

            <button 
              className="w-full bg-[#0F9D8A] hover:bg-[#0D8A79] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-6"
              disabled={!mlFile || mlLoading}
              onClick={handleMLTrain}
            >
              {mlLoading ? (
                <><RefreshCw size={18} className="animate-spin" /> Training Neural Net...</>
              ) : (
                <><Cpu size={18} /> Initialize Neural Engine</>
              )}
            </button>

            {mlError && (
              <div className="mt-4 text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100 flex items-center gap-2">
                <AlertTriangle size={14} /> {mlError}
              </div>
            )}
          </FloatingCard>

          <FloatingCard padding="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                <Database size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Strategy Matrix</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Algorithm', val: mlResults?.algorithm || "Random Forest Classifier" },
                { label: 'Preprocessing', val: 'Label Encoding + Scaling' },
                { label: 'Imputation', val: 'SimpleImputer (Mean)' },
                { label: 'Validation', val: '80/20 Train-Test Split' }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                  <span className="text-xs font-bold text-slate-700">{item.val}</span>
                </div>
              ))}
            </div>
          </FloatingCard>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <FloatingCard padding="p-8 h-full">
            {!mlResults && !mlLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
                  <Layers size={48} />
                </div>
                <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Awaiting Neural Input</h2>
                <p className="text-sm font-medium text-slate-400 mt-2 max-w-xs">Upload a clinical dataset to begin supervised learning and performance evaluation.</p>
              </div>
            ) : mlLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-teal-500/10 border-t-[#0F9D8A] rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-[#0F9D8A]">
                    <Activity size={32} className="animate-pulse" />
                  </div>
                </div>
                <p className="text-sm font-black text-[#0F9D8A] uppercase tracking-widest mt-8 animate-pulse">Optimizing Neural Weights...</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Calculating hyper-parameters and loss functions</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                    <CheckCircle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Training Successful</span>
                  </div>
                  <button onClick={downloadResultsAsJSON} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                    <Download size={14} /> Export Metadata
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Accuracy', val: mlResults.accuracy, color: 'emerald' },
                    { label: 'Precision', val: mlResults.precision, color: 'teal' },
                    { label: 'Recall', val: mlResults.recall, color: 'blue' },
                    { label: 'F1-Score', val: mlResults.f1_score, color: 'purple' },
                  ].map((m, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{m.label}</p>
                      <p className={`text-2xl font-black text-${m.color}-600 leading-none`}>{(m.val * 100).toFixed(1)}%</p>
                      <div className="w-full h-1 bg-white rounded-full mt-3 overflow-hidden">
                        <div className={`h-full bg-${m.color}-500`} style={{ width: `${m.val * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="clinical-card overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                    <Eye size={16} className="text-slate-400" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Inference Validation Samples</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">ID</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Confidence</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Actual</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Inference</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {mlResults.sample_predictions?.slice(0, 5).map((pred, i) => (
                          <tr key={i} className="hover:bg-slate-50/30">
                            <td className="px-6 py-3 text-xs font-bold text-slate-400">#00{i+1}</td>
                            <td className="px-6 py-3">
                              <span className="text-xs font-black text-slate-700">{(pred.confidence * 100).toFixed(1)}%</span>
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-slate-100 bg-white">{pred.actual}</span>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${pred.actual === pred.predicted ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-rose-100 bg-rose-50 text-rose-600'}`}>
                                {pred.predicted}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right">
                              {pred.actual === pred.predicted ? (
                                <span className="text-[10px] font-black text-emerald-500 uppercase">HIT</span>
                              ) : (
                                <span className="text-[10px] font-black text-rose-500 uppercase">MISS</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 text-white flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Deployment Strategy</h4>
                    <p className="text-sm font-bold mt-1">Ready for neural integration into clinical pipelines.</p>
                  </div>
                  <button className="px-6 py-2 bg-[#0F9D8A] text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-teal-500/20">Deploy Model</button>
                </div>
              </motion.div>
            )}
          </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default MLStudio;
