import React from 'react';
import { Activity } from 'lucide-react';

const MetricCard = ({ 
  label, 
  value, 
  unit, 
  badgeText, 
  badgeType, 
  infoText, 
  hasData = true 
}) => {
  // Badge styling based on clinical severity
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'critical':
      case 'critical_low':
      case 'critical_high':
      case 'high':
        return 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]';
      case 'low':
      case 'elevated':
      case 'attention':
      case 'moderate':
        return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
      case 'normal':
      case 'healthy':
      case 'optimal':
        return 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]';
      case 'pending':
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const badgeClass = getBadgeStyle(badgeType);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-h-[140px]">
      {/* Top: Metric name & Status badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500">
          {label}
        </span>
        {hasData ? (
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${badgeClass}`}>
            {badgeText}
          </span>
        ) : (
          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-md bg-slate-100 text-slate-400 border border-slate-200">
            NO DATA
          </span>
        )}
      </div>

      {/* Middle: Value & Unit */}
      <div className="my-1.5">
        {hasData ? (
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-medium text-slate-400">
                {unit}
              </span>
            )}
          </div>
        ) : (
          <div className="text-sm font-medium text-slate-400 italic py-1">
            No recent reading
          </div>
        )}
      </div>

      {/* Bottom: Last updated information or clinical range note */}
      <div className="text-[11px] text-slate-400 font-normal pt-2 border-t border-slate-100/80 mt-1">
        {infoText}
      </div>
    </div>
  );
};

const HealthSummary = ({ metrics }) => {
  return (
    <section className="mb-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            CURRENT HEALTH
          </p>
          <h2 className="font-editorial text-2xl sm:text-[26px] font-normal text-slate-900 leading-snug">
            Your latest readings
          </h2>
        </div>
        <p className="text-xs text-slate-400 font-normal">
          Compared with standard clinical ranges
        </p>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Blood Pressure */}
        <MetricCard
          label="Blood pressure"
          value={metrics?.bp?.value}
          unit="mmHg"
          badgeText={metrics?.bp?.badgeText || 'NORMAL'}
          badgeType={metrics?.bp?.badgeType || 'normal'}
          infoText={metrics?.bp?.infoText || 'Updated recently'}
          hasData={metrics?.bp?.hasData}
        />

        {/* 2. Fasting Glucose */}
        <MetricCard
          label="Fasting glucose"
          value={metrics?.glucose?.value}
          unit="mg/dL"
          badgeText={metrics?.glucose?.badgeText || 'NORMAL'}
          badgeType={metrics?.glucose?.badgeType || 'normal'}
          infoText={metrics?.glucose?.infoText || 'Fasting plasma level'}
          hasData={metrics?.glucose?.hasData}
        />

        {/* 3. Resting Heart Rate */}
        <MetricCard
          label="Resting heart rate"
          value={metrics?.heartRate?.value}
          unit="bpm"
          badgeText={metrics?.heartRate?.badgeText || 'NORMAL'}
          badgeType={metrics?.heartRate?.badgeType || 'normal'}
          infoText={metrics?.heartRate?.infoText || 'Regular rhythm'}
          hasData={metrics?.heartRate?.hasData}
        />

        {/* 4. Body Mass Index */}
        <MetricCard
          label="Body mass index"
          value={metrics?.bmi?.value}
          unit="kg/m²"
          badgeText={metrics?.bmi?.badgeText || 'HEALTHY'}
          badgeType={metrics?.bmi?.badgeType || 'healthy'}
          infoText={metrics?.bmi?.infoText || 'Healthy range 18.5 – 24.9'}
          hasData={metrics?.bmi?.hasData}
        />
      </div>
    </section>
  );
};

export default HealthSummary;
