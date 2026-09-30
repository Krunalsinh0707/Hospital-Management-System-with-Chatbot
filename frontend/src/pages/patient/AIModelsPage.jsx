import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Search, Cpu, CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { getAIModels } from '../../services/modelRegistryService';
import { useNavigate } from 'react-router-dom';

const AIModelsPage = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const data = await getAIModels();
      setModels(data || []);
    } catch (err) {
      console.error("Failed to fetch models:", err);
      // Fallback model registry display
      setModels([
        { slug: 'cardiology-risk-v1', name: 'Cardiology Risk Assessment', department: 'Cardiology', version: '1.0', status: 'Available', algorithm: 'Random Forest Classifier', description: 'Assesses cardiovascular risk from vitals and ECG parameters.' },
        { slug: 'endocrinology-diabetes-v1', name: 'Diabetes Vector Model', department: 'Endocrinology', version: '1.0', status: 'Available', algorithm: 'Support Vector Machine', description: 'Evaluates glucose, insulin, and metabolic parameters.' },
        { slug: 'hematology-cbc-v1', name: 'CBC Hematology Analyzer', department: 'Hematology', version: '1.0', status: 'Available', algorithm: 'Gradient Boosting Classifier', description: 'Parses blood cell counts, hemoglobin, and platelets.' },
        { slug: 'hypertension-v1', name: 'Blood Pressure & HTN Model', department: 'Cardiology', version: '1.0', status: 'Available', algorithm: 'Logistic Regression', description: 'Classifies arterial blood pressure and hypertension stage.' },
        { slug: 'oncology-screen-v1', name: 'Oncology Marker Model', department: 'Oncology', version: '0.9', status: 'Coming Soon', algorithm: 'Deep Neural Net', description: 'Biostatistical tumor marker screening model.' },
        { slug: 'pulmonology-spo2-v1', name: 'Pulmonary Respiratory Engine', department: 'Pulmonology', version: '0.8', status: 'Coming Soon', algorithm: 'Convolutional Net', description: 'Analyzes chest imaging and respiratory SpO2 parameters.' },
        { slug: 'orthopedics-v1', name: 'Orthopedic Bone Analyzer', department: 'Orthopedics', version: '1.0', status: 'Doctor Review Required', algorithm: 'Rule Engine', description: 'Bone density and joint diagnostic support.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-[#0F9D8A] text-xs font-black uppercase tracking-wider mb-2">
            <Layers size={14} /> DYNAMIC MODEL REGISTRY
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">AVAILABLE AI MEDICAL MODELS</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            MediNexus is built on an extensible AI architecture supporting specialized diagnostic models.
          </p>
        </div>

        <button
          onClick={() => navigate('/own-report')}
          className="px-5 py-3 bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          <Sparkles size={16} /> I Have My Own Report
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search AI model by name or department (e.g., Cardiology, Diabetes, Hematology)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-[#0F9D8A]"
          />
        </div>
      </div>

      {/* Models Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs font-bold">
          Loading AI Model Registry...
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
          <Layers size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-xs font-bold">No AI models found matching your search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => {
            const isAvailable = model.status === 'Available' || model.status === 'Active';
            const isComingSoon = model.status === 'Coming Soon';

            return (
              <motion.div
                key={model.slug || model.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-[#0F9D8A] transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0F9D8A] bg-teal-50 px-2.5 py-0.5 rounded">
                      {model.department}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isAvailable
                        ? 'bg-emerald-100 text-emerald-800'
                        : isComingSoon
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {model.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-[#0F9D8A] transition-colors">
                      {model.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      {model.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>Algorithm: {model.algorithm || 'Machine Learning'}</span>
                    <span>v{model.version || '1.0'}</span>
                  </div>

                  <button
                    onClick={() => navigate('/own-report', { state: { departmentSlug: model.department.toLowerCase() } })}
                    className={`w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      isAvailable
                        ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {isAvailable ? (
                      <>
                        <span>Use Model</span>
                        <ArrowRight size={14} />
                      </>
                    ) : isComingSoon ? (
                      <span>Coming Soon</span>
                    ) : (
                      <span>Submit for Doctor Review</span>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AIModelsPage;
