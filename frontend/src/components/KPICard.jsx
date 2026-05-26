import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCcw, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import FloatingCard from './FloatingCard';

const KPICard = ({ 
  title, 
  value, 
  unit = '', 
  change = 0, 
  loading = false, 
  error = false, 
  onRetry, 
  lastUpdated,
  icon,
  tooltip
}) => {
  
  const getStatusColor = (v, type) => {
    if (type === 'glucose') {
      const num = parseFloat(v);
      if (num >= 126) return 'text-rose-600';
      if (num >= 100) return 'text-amber-600';
      return 'text-teal-600';
    }
    if (type === 'bp') {
      const systolic = parseInt(String(v).split('/')[0]);
      if (systolic >= 140) return 'text-rose-600';
      if (systolic >= 120) return 'text-amber-600';
      return 'text-teal-600';
    }
    if (type === 'heartRate') {
      const num = parseFloat(v);
      if (num > 100 || num < 60) return 'text-amber-600';
      return 'text-teal-600';
    }
    if (type === 'cbc') {
      const num = parseFloat(v);
      if (num > 0) return 'text-rose-600';
      return 'text-teal-600';
    }
    return 'text-slate-800';
  };

  const titleLower = title.toLowerCase();
  const type = titleLower.includes('glucose') ? 'glucose' : 
               titleLower.includes('pressure') ? 'bp' :
               titleLower.includes('heart') ? 'heartRate' :
               titleLower.includes('cbc') ? 'cbc' : 'other';

  const statusColor = getStatusColor(value, type);

  return (
    <FloatingCard className="group relative overflow-hidden shadow-lg shadow-slate-200/40 border-none" padding="p-0">
      {/* Decorative side accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-500 ${statusColor.replace('text', 'bg')}`} />
      
      <div className="p-6 h-full flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
                <div className="w-12 h-5 bg-slate-100 rounded-full animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="w-20 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="w-32 h-8 bg-slate-50 rounded-lg animate-pulse" />
              </div>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-4 text-center h-full"
            >
              <div className="w-10 h-10 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mb-3">
                <AlertCircle size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Neural Sync Error</p>
              <button 
                onClick={onRetry}
                className="bg-slate-800 text-white text-[10px] font-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-all uppercase tracking-widest shadow-lg shadow-slate-200"
              >
                <RefreshCcw size={12} /> Re-Sync
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              <div className="flex justify-between items-start mb-5">
                <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm ${statusColor}`}>
                  {icon}
                </div>
                {change !== 0 && (
                  <div className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full shadow-sm transition-all duration-500 ${change > 0 ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'}`}>
                    {change > 0 ? <TrendingUp size={14} strokeWidth={3} /> : <TrendingDown size={14} strokeWidth={3} />}
                    {Math.abs(change)}%
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1" title={tooltip}>
                  {title}
                </h3>
                <div className="flex items-baseline gap-1.5">
                  <h2 className={`text-3xl font-black tracking-tight text-slate-900 transition-colors duration-500`}>
                    {value}
                  </h2>
                  {unit && <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{unit}</span>}
                </div>
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 flex items-center gap-2 font-black uppercase tracking-widest">
                  <Clock size={12} className="text-slate-300" /> 
                  {lastUpdated ? `Sync ${lastUpdated}s ago` : 'Synced Now'}
                </div>
                <div className={`w-2 h-2 rounded-full animate-pulse ${statusColor.replace('text', 'bg')}`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FloatingCard>
  );
};

export default KPICard;
