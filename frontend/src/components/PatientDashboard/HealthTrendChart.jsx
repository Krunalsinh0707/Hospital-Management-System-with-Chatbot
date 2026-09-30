import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { LineChart as LineChartIcon, Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 shadow-lg text-xs">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color || '#0D9488' }}
            />
            <span className="font-semibold text-slate-900">
              {entry.name}: {entry.value} {unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const HealthTrendChart = ({ historicalData = {} }) => {
  const [activeMetric, setActiveMetric] = useState('bp'); // 'bp' | 'glucose' | 'hr' | 'weight'
  const [activeTimeframe, setActiveTimeframe] = useState('7D'); // '7D' | '30D' | '3M' | '6M'

  // Metric configuration
  const metricConfig = useMemo(() => {
    switch (activeMetric) {
      case 'glucose':
        return {
          title: 'glucose',
          unit: 'mg/dL',
          dataKey: 'value',
          dataKey2: null,
          name: 'Fasting Glucose',
          name2: null,
          color: '#0D9488',
          color2: null
        };
      case 'hr':
        return {
          title: 'heart rate',
          unit: 'bpm',
          dataKey: 'value',
          dataKey2: null,
          name: 'Resting Heart Rate',
          name2: null,
          color: '#0D9488',
          color2: null
        };
      case 'weight':
        return {
          title: 'body mass index',
          unit: 'kg/m²',
          dataKey: 'value',
          dataKey2: null,
          name: 'BMI',
          name2: null,
          color: '#0D9488',
          color2: null
        };
      case 'bp':
      default:
        return {
          title: 'blood pressure',
          unit: 'mmHg',
          dataKey: 'systolic',
          dataKey2: 'diastolic',
          name: 'Systolic BP',
          name2: 'Diastolic BP',
          color: '#0D9488',
          color2: '#2DD4BF'
        };
    }
  }, [activeMetric]);

  // Filter historical points by selected timeframe
  const filteredData = useMemo(() => {
    const rawList = historicalData[activeMetric] || [];
    if (!rawList || rawList.length === 0) return [];

    const now = new Date();
    let daysToInclude = 7;
    if (activeTimeframe === '30D') daysToInclude = 30;
    else if (activeTimeframe === '3M') daysToInclude = 90;
    else if (activeTimeframe === '6M') daysToInclude = 180;

    const cutoff = new Date(now.getTime() - daysToInclude * 24 * 60 * 60 * 1000);

    const filtered = rawList.filter(item => {
      if (!item.dateObj) return true;
      return new Date(item.dateObj) >= cutoff;
    });

    // If filtered points are enough, return them; otherwise if all points are recent enough return up to 7
    return filtered.length >= 2 ? filtered : rawList.slice(-7);
  }, [historicalData, activeMetric, activeTimeframe]);

  const hasTrend = filteredData.length >= 2;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs mb-8">
      {/* Eyebrow & Title */}
      <div className="mb-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          PATTERNS OVER TIME
        </p>
        <h2 className="font-editorial text-2xl sm:text-[26px] font-normal text-slate-900 leading-snug">
          Health trends
        </h2>
      </div>

      {/* Control Tabs: Metrics on left, Timeframe on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        {/* Metric Selector Tabs */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto max-w-full">
          {[
            { id: 'bp', label: 'Blood pressure' },
            { id: 'glucose', label: 'Glucose' },
            { id: 'hr', label: 'Heart rate' },
            { id: 'weight', label: 'Weight' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMetric(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeMetric === tab.id
                  ? 'bg-[#0E5B55] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Time Filters on Right */}
        <div className="inline-flex items-center gap-1 self-start sm:self-auto p-1 bg-slate-50 border border-slate-200/60 rounded-xl">
          {['7D', '30D', '3M', '6M'].map(tf => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTimeframe === tf
                  ? 'bg-[#E8F5F3] text-[#0D9488]'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas or Clean Empty State */}
      {hasTrend ? (
        <div className="w-full">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                  {metricConfig.dataKey2 && (
                    <linearGradient id="tealLightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.0} />
                    </linearGradient>
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={{ stroke: '#E2E8F0' }}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  domain={['auto', 'auto']}
                />
                <RechartsTooltip 
                  content={<CustomTooltip unit={metricConfig.unit} />}
                />
                <Area 
                  type="monotone" 
                  dataKey={metricConfig.dataKey} 
                  name={metricConfig.name}
                  stroke={metricConfig.color} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#tealGradient)" 
                  dot={{ fill: '#0D9488', r: 3 }}
                  activeDot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 2 }}
                />
                {metricConfig.dataKey2 && (
                  <Area 
                    type="monotone" 
                    dataKey={metricConfig.dataKey2} 
                    name={metricConfig.name2}
                    stroke={metricConfig.color2} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#tealLightGradient)" 
                    dot={{ fill: '#2DD4BF', r: 3 }}
                    activeDot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Subtitle Caption */}
          <p className="text-[11px] text-slate-400 font-normal mt-3 pt-3 border-t border-slate-100">
            Showing {metricConfig.title} from verified clinical entries over {activeTimeframe}.
          </p>
        </div>
      ) : (
        <div className="py-12 px-4 rounded-xl bg-slate-50/70 border border-dashed border-slate-200 text-center">
          <div className="w-10 h-10 rounded-full bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto mb-3">
            <LineChartIcon size={20} />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 mb-1">
            Not enough historical data to display a trend.
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            At least two clinical entries are required to map patterns for {metricConfig.title} over {activeTimeframe}.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
            >
              <Plus size={13} />
              <span>Record vitals</span>
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-2xs"
            >
              <FileText size={13} />
              <span>Upload report</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthTrendChart;
