import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, AlertCircle, RefreshCcw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const MetricCard = ({ 
  title, 
  value, 
  unit = '', 
  change = 0, 
  loading = false, 
  error = false, 
  onRetry, 
  lastUpdated,
  icon,
  sparklineData = [] 
}) => {
  
  const isPositive = change > 0;
  const statusColor = change === 0 ? 'text-slate-400' : (isPositive ? 'text-rose-500' : 'text-emerald-500');

  return (
    <div className="clinical-card p-5 h-full flex flex-col relative overflow-hidden group">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between">
              <div className="w-8 h-8 bg-slate-100 rounded animate-pulse" />
              <div className="w-20 h-10 bg-slate-50 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="w-24 h-3 bg-slate-100 rounded animate-pulse" />
              <div className="w-16 h-6 bg-slate-100 rounded animate-pulse" />
            </div>
          </motion.div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full py-2">
            <AlertCircle className="text-rose-400 mb-2" size={20} />
            <button onClick={onRetry} className="text-[10px] font-bold text-teal-600 uppercase flex items-center gap-1">
              <RefreshCcw size={10} /> Retry
            </button>
          </div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-teal-600 bg-teal-50 p-2 rounded-lg">
                {icon}
              </div>
              <div className="h-10 w-24">
                {sparklineData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={change >= 0 ? "#F43F5E" : "#10B981"} 
                        fill={change >= 0 ? "#FFF1F2" : "#F0FDF4"} 
                        strokeWidth={1.5} 
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="flex-1">
              <span className="text-small-uppercase mb-1 block">{title}</span>
              <div className="flex items-baseline gap-1">
                <h2 className="text-2xl font-bold text-slate-800">{value}</h2>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">{unit}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className={`flex items-center gap-1 text-[11px] font-bold ${statusColor}`}>
                {change !== 0 && (isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
                {change !== 0 ? `${Math.abs(change)}%` : 'Stable'}
                <span className="text-slate-300 font-medium ml-1">Trend</span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                <Clock size={10} /> {lastUpdated ? `${lastUpdated}s` : 'Now'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MetricCard;
