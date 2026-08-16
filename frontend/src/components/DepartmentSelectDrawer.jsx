import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Heart, Activity, Droplets, Wind, Dna, Brain, Bone, Stethoscope, Shield, User, UserCheck, Hospital, AlertOctagon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getDepartmentsWithModels } from '../services/modelRegistryService';

const iconMap = {
  Heart: <Heart className="w-5 h-5 text-rose-500" />,
  Activity: <Activity className="w-5 h-5 text-amber-500" />,
  Droplets: <Droplets className="w-5 h-5 text-rose-600" />,
  Wind: <Wind className="w-5 h-5 text-sky-500" />,
  Dna: <Dna className="w-5 h-5 text-indigo-500" />,
  Brain: <Brain className="w-5 h-5 text-purple-500" />,
  Bone: <Bone className="w-5 h-5 text-[#0F9D8A]" />,
  Stethoscope: <Stethoscope className="w-5 h-5 text-emerald-500" />,
  Shield: <Shield className="w-5 h-5 text-blue-500" />,
  User: <User className="w-5 h-5 text-teal-500" />,
  UserCheck: <UserCheck className="w-5 h-5 text-pink-500" />,
  Hospital: <Hospital className="w-5 h-5 text-slate-700" />,
  AlertOctagon: <AlertOctagon className="w-5 h-5 text-rose-600" />
};

const DepartmentSelectDrawer = ({ isOpen, onClose, onSelectDepartment }) => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await getDepartmentsWithModels();
      setDepartments(data || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
      // Fallback departments if backend offline
      setDepartments([
        { slug: 'cardiology', name: 'Cardiology', icon: 'Heart', description: 'Heart disease & cardiac risk', status: 'Available' },
        { slug: 'endocrinology', name: 'Endocrinology', icon: 'Activity', description: 'Diabetes & metabolic health', status: 'Available' },
        { slug: 'hematology', name: 'Hematology', icon: 'Droplets', description: 'CBC & blood disorders', status: 'Available' },
        { slug: 'pulmonology', name: 'Pulmonology', icon: 'Wind', description: 'Lungs & respiratory care', status: 'Coming Soon' },
        { slug: 'oncology', name: 'Oncology', icon: 'Dna', description: 'Cancer risk & tumor markers', status: 'Coming Soon' },
        { slug: 'neurology', name: 'Neurology', icon: 'Brain', description: 'Neurological & brain health', status: 'Coming Soon' },
        { slug: 'orthopedics', name: 'Orthopedics', icon: 'Bone', description: 'Bones, joints & spine', status: 'Doctor Review Required' },
        { slug: 'general', name: 'General Medicine', icon: 'Hospital', description: 'General vitals assessment', status: 'Available' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100"
        >
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0F9D8A] bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full">
                STEP 1 OF 3
              </span>
              <h2 className="text-xl font-extrabold tracking-tight mt-1">SELECT MEDICAL DEPARTMENT</h2>
              <p className="text-xs text-slate-400 mt-0.5">Select the department corresponding to your medical report or condition.</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search medical department (e.g. Cardiology, Oncology, Hematology)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-[#0F9D8A] transition-all"
              />
            </div>
          </div>

          {/* Department List Grid */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 py-12 text-center text-slate-400 text-xs font-bold">
                Loading scalable medical registry...
              </div>
            ) : filteredDepts.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-slate-400 text-xs font-bold">
                No matching departments found.
              </div>
            ) : (
              filteredDepts.map((dept) => (
                <div
                  key={dept.slug}
                  onClick={() => {
                    onSelectDepartment(dept);
                    onClose();
                  }}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-[#0F9D8A] bg-white hover:bg-teal-50/30 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-100 flex items-center justify-center shadow-inner">
                      {iconMap[dept.icon] || <Stethoscope className="w-5 h-5 text-teal-600" />}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      dept.status === 'Available' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : dept.status === 'Coming Soon'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {dept.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0F9D8A] transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {dept.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-extrabold text-[#0F9D8A]">
                    <span>Select Department</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DepartmentSelectDrawer;
