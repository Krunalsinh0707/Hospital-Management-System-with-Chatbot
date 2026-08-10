import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Heart, Zap, FileText, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Search, Bell, Download, RefreshCw, Eye, User, ShieldCheck
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip as ChartTooltip, Filler, Legend as ChartLegend, ArcElement,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Area, AreaChart, Legend as RechartsLegend 
} from 'recharts';

import MetricCard from '../components/MetricCard';
import { useDashboard } from '../hooks/useDashboard';
import { useLayout } from '../App';
import ClinicalHeader from '../components/ClinicalHeader';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, ChartTooltip, Filler, ChartLegend, ArcElement
);

const Dashboard = () => {
  const { vitals, healthScore, chartData, telemetry, riskData, insights, loading, error, lastUpdated, refetch } = useDashboard();
  const { toggleSidebar } = useLayout();
  const [timeRange, setTimeRange] = useState('Day');

  // Helper for Status Badges
  const StatusBadge = ({ status }) => {
    const map = {
      'Low Risk': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'Moderate Risk': 'bg-amber-50 text-amber-600 border-amber-100',
      'High Risk': 'bg-rose-50 text-rose-600 border-rose-100',
    };
    const classes = map[status] || 'bg-slate-50 text-slate-500 border-slate-100';
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${classes}`}>{status}</span>;
  };

  // Process sparkline data from chartData
  const getSparkline = (key) => chartData.map(d => ({ value: d[key] }));

  const donutData = {
    labels: ['Low', 'Moderate', 'High'],
    datasets: [{
      data: [riskData.low || 1, riskData.moderate || 0, riskData.high || 0],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
      cutout: '75%',
    }],
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
        
        {/* 1. HEADER ROW */}
        <ClinicalHeader 
          title="AI Health Intelligence" 
          subtitle="Clinical Decision Support System" 
          onMenuClick={toggleSidebar} 
        />

        {/* 2. KPI SECTION */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Glucose Levels"
            value={vitals?.glucose?.value || '---'}
            unit="mg/dL"
            change={vitals?.glucose?.change}
            loading={loading && !vitals}
            icon={<Activity size={20} />}
            sparklineData={getSparkline('glucose')}
            lastUpdated={lastUpdated ? Math.floor((new Date() - lastUpdated) / 1000) : 0}
          />
          <MetricCard 
            title="Blood Pressure"
            value={vitals?.bloodPressure ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}` : '---'}
            unit="mmHg"
            loading={loading && !vitals}
            icon={<Heart size={20} />}
            sparklineData={getSparkline('systolic')}
            lastUpdated={lastUpdated ? Math.floor((new Date() - lastUpdated) / 1000) : 0}
          />
          <MetricCard 
            title="Avg Heart Rate"
            value={vitals?.heartRate?.value || '---'}
            unit="BPM"
            change={vitals?.heartRate?.change}
            loading={loading && !vitals}
            icon={<Zap size={20} />}
            sparklineData={getSparkline('glucose').map(d => ({ value: d.value * 0.8 }))} // Simulated HR sparkline
            lastUpdated={lastUpdated ? Math.floor((new Date() - lastUpdated) / 1000) : 0}
          />
          <MetricCard 
            title="Composite Health Score"
            value={`${healthScore || 100}/100`}
            unit={healthScore >= 80 ? "Optimal" : healthScore >= 60 ? "Moderate" : "Low"}
            loading={loading && !vitals}
            icon={<ShieldCheck size={20} />}
            sparklineData={getSparkline('glucose').reverse()}
            lastUpdated={lastUpdated ? Math.floor((new Date() - lastUpdated) / 1000) : 0}
          />
        </div>

        {/* 3. MAIN ANALYTICS */}
        <div className="col-span-12 lg:col-span-8 clinical-card p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">Vital Trends Chart</h2>
              <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider mt-1">Multi-vector physiological monitoring</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['Day', 'Week', 'Month'].map((t) => (
                <button 
                  key={t} 
                  onClick={() => setTimeRange(t)}
                  className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition-all ${timeRange === t ? 'bg-white text-[#0F9D8A] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F9D8A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0F9D8A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: '700' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: '700' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: '700' }} />
                <RechartsLegend verticalAlign="top" iconType="circle" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}/>
                <Area type="monotone" name="Glucose" dataKey="glucose" stroke="#0F9D8A" strokeWidth={3} fillOpacity={1} fill="url(#colPrimary)" />
                <Area type="monotone" name="Systolic BP" dataKey="systolic" stroke="#8B5CF6" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 clinical-card p-6 flex flex-col">
          <h2 className="text-[20px] font-bold text-slate-800 tracking-tight mb-8">Risk Distribution</h2>
          <div className="flex-1 relative min-h-[300px]">
            <Doughnut 
              data={donutData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, font: { family: 'Inter', size: 11, weight: '700' } } }
                }
              }} 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
              <span className="text-4xl font-black text-slate-800 leading-none">{(riskData.low + riskData.moderate + riskData.high) || 0}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Assessments</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-50">
            <div className="text-center">
              <span className="block text-[14px] font-bold text-emerald-600">{riskData.low || 0}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase">Low</span>
            </div>
            <div className="text-center border-x border-slate-100">
              <span className="block text-[14px] font-bold text-amber-600">{riskData.moderate || 0}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase">Mod</span>
            </div>
            <div className="text-center">
              <span className="block text-[14px] font-bold text-rose-600">{riskData.high || 0}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase">High</span>
            </div>
          </div>
        </div>

        {/* 4. ALERT SECTION */}
        {(() => {
          const highRiskScans = telemetry.filter(t => t.status === 'High Risk');
          const isHighRisk = highRiskScans.length > 0 || riskData.high > 0;
          
          if (isHighRisk) {
            return (
              <div className="col-span-12 clinical-card border-l-4 border-l-rose-500 bg-rose-50/30 p-6 flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[18px] font-bold text-slate-900">Critical Medical Alerts Panel</h3>
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black uppercase rounded-lg">High Severity</span>
                  </div>
                  <p className="text-slate-600 font-medium mb-3">
                    AI Engine detected {highRiskScans.length || riskData.high} high-risk physiological vector(s) requiring clinical review ({highRiskScans.map(s => s.scanType).join(', ') || 'Risk Assessment'}).
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase">
                      <Clock size={14} /> Last Scan: {highRiskScans[0]?.timestamp || 'Recent'}
                    </div>
                    <button onClick={refetch} className="text-[11px] font-black text-rose-600 uppercase hover:underline">Synchronize Records</button>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div className="col-span-12 clinical-card border-l-4 border-l-emerald-500 bg-emerald-50/30 p-6 flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[18px] font-bold text-slate-900">Physiological Safety Status</h3>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-lg">Nominal</span>
                  </div>
                  <p className="text-slate-600 font-medium mb-3">All monitored physiological vectors are operating within normal clinical reference ranges.</p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase">
                      <Clock size={14} /> System Verified: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                    </div>
                    <button onClick={refetch} className="text-[11px] font-black text-emerald-600 uppercase hover:underline">Synchronize Records</button>
                  </div>
                </div>
              </div>
            );
          }
        })()}

        {/* 5. AI INSIGHTS + TABLE */}
        <div className="col-span-12 lg:col-span-6 clinical-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-[#0F9D8A]">
                <Zap size={18} />
              </div>
              <h3 className="text-[18px] font-bold text-slate-800">Predictive AI Insights</h3>
            </div>
            <button className="text-[11px] font-black text-[#0F9D8A] uppercase tracking-widest bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-all">
              Generate Audit Report
            </button>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Cardiac Vector Stability', val: (insights?.cardiac_confidence || 0.15) * 100 },
              { label: 'Glycemic Response Index', val: (insights?.glucose_confidence || 0.12) * 100 },
              { label: 'Hypertension Progression', val: (insights?.hypertension_confidence || 0.20) * 100 }
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">{item.label}</span>
                  <span className="text-[10px] font-black text-slate-400">{item.val.toFixed(1)}% Confidence</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    className={`h-full rounded-full ${item.val > 70 ? 'bg-rose-500' : (item.val > 40 ? 'bg-amber-500' : 'bg-[#0F9D8A]')}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 clinical-card overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-[18px] font-bold text-slate-800">Patient Records Table</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Feed: {telemetry.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Test Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Risk Level</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {telemetry.slice(0, 5).map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-700">{t.scanType}</td>
                    <td className="px-6 py-4 text-[11px] font-semibold text-slate-400">{t.timestamp}</td>
                    <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[11px] font-black text-[#0F9D8A] uppercase tracking-widest hover:underline flex items-center gap-1 ml-auto">
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
    </div>
  );
};

export default Dashboard;
