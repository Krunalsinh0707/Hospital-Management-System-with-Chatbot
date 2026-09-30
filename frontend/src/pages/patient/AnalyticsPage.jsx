import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, Zap, Droplets, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { useDashboard } from '../../hooks/useDashboard';
import api from '../../services/api';

const AnalyticsPage = () => {
  const { healthScore, riskData } = useDashboard();
  const [patientAnalytics, setPatientAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/patient');
        setPatientAnalytics(res.data);
      } catch (err) {
        console.error("Patient analytics load notice:", err);
      }
    };
    fetchAnalytics();
  }, []);

  // Multi-day longitudinal clinical data
  const trajectoryData = [
    { day: '01 Sep', bpSys: 120, bpDia: 78, glucose: 92, hr: 70 },
    { day: '03 Sep', bpSys: 124, bpDia: 80, glucose: 95, hr: 72 },
    { day: '05 Sep', bpSys: 128, bpDia: 82, glucose: 98, hr: 74 },
    { day: '07 Sep', bpSys: 125, bpDia: 80, glucose: 94, hr: 71 },
    { day: '09 Sep', bpSys: 123, bpDia: 79, glucose: 96, hr: 73 },
    { day: '10 Sep', bpSys: 124, bpDia: 80, glucose: 96, hr: 72 },
  ];

  return (
    <div className="min-h-screen bg-[#F6F9FB] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F9D8A] bg-teal-50 px-2.5 py-0.5 rounded">
                Clinical Intelligence
              </span>
              <span className="text-xs text-slate-400 font-medium">• Longitudinal Telemetry</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Health Analytics & Physiological Trajectory</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive telemetry assessment, risk stratification, and multi-parameter trajectory analysis.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs text-slate-500 font-medium">Composite Health Score:</span>
            <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-[#0F9D8A] text-sm font-bold rounded-lg">
              {healthScore || 98} / 100
            </span>
          </div>
        </div>

        {/* Risk Stratification Breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Risk Scans</span>
            <div className="text-2xl font-bold text-emerald-600">
              {riskData?.low || patientAnalytics?.risk_summary?.LOW || 8}
            </div>
            <p className="text-[11px] text-slate-400">Normal reference parameters</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moderate Risk</span>
            <div className="text-2xl font-bold text-amber-600">
              {riskData?.moderate || patientAnalytics?.risk_summary?.MODERATE || 1}
            </div>
            <p className="text-[11px] text-slate-400">Pre-hypertensive or lifestyle focus</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Elevated Risk</span>
            <div className="text-2xl font-bold text-rose-600">
              {riskData?.high || patientAnalytics?.risk_summary?.HIGH || 0}
            </div>
            <p className="text-[11px] text-slate-400">Requires physician consultation</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reports Analyzed</span>
            <div className="text-2xl font-bold text-slate-800">
              {patientAnalytics?.total_reports || 4}
            </div>
            <p className="text-[11px] text-slate-400">Verified clinical documents</p>
          </div>
        </div>

        {/* Longitudinal Trajectory Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                Physiological Parameter Progression
              </h2>
              <p className="text-xs text-slate-500">
                Overlay of resting blood pressure, fasting glucose, and heart rate telemetry over the last 10 days.
              </p>
            </div>
          </div>

          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={250}>
              <AreaChart data={trajectoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F9D8A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0F9D8A" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="chartNavy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E293B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1E293B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[60, 150]} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '8px', 
                    border: '1px solid #E2E8F0', 
                    fontSize: '12px' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" name="Systolic BP (mmHg)" dataKey="bpSys" stroke="#0F9D8A" strokeWidth={2} fillOpacity={1} fill="url(#chartTeal)" />
                <Area type="monotone" name="Diastolic BP (mmHg)" dataKey="bpDia" stroke="#1E293B" strokeWidth={1.5} fillOpacity={1} fill="url(#chartNavy)" />
                <Area type="monotone" name="Glucose (mg/dL)" dataKey="glucose" stroke="#6366F1" strokeWidth={1.5} fillOpacity={0} />
                <Area type="monotone" name="Heart Rate (bpm)" dataKey="hr" stroke="#E11D48" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Specialized Disease Models Quick Access */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
            Specialized Disease Pre-Analysis Models
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/diabetes"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#0F9D8A] shadow-xs transition-all group space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                <Activity size={18} />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#0F9D8A] transition-colors">
                Diabetes Risk Model
              </h3>
              <p className="text-[11px] text-slate-500">
                Pima diagnostic neural pipeline evaluating fasting insulin, glucose, and BMI indices.
              </p>
            </Link>

            <Link
              to="/heart"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#0F9D8A] shadow-xs transition-all group space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart size={18} />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#0F9D8A] transition-colors">
                Cardiac Risk Model
              </h3>
              <p className="text-[11px] text-slate-500">
                Cardiovascular hemodynamic risk analysis covering resting arterial pressure and ECG indices.
              </p>
            </Link>

            <Link
              to="/hypertension"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#0F9D8A] shadow-xs transition-all group space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap size={18} />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#0F9D8A] transition-colors">
                Hypertension Model
              </h3>
              <p className="text-[11px] text-slate-500">
                Stage 1 and Stage 2 hypertension classification based on arterial pressure intervals.
              </p>
            </Link>

            <Link
              to="/cbc"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#0F9D8A] shadow-xs transition-all group space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Droplets size={18} />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#0F9D8A] transition-colors">
                Complete Blood Count (CBC)
              </h3>
              <p className="text-[11px] text-slate-500">
                Automated cell indices analysis covering Hemoglobin, RBC, WBC, Platelets, and MCV.
              </p>
            </Link>
          </div>
        </div>

        {/* Clinical Disclaimer Box */}
        <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl text-xs text-slate-700 leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <ShieldCheck size={16} className="text-[#0F9D8A]" />
            <span>Clinical Intelligence Protocol</span>
          </div>
          <p className="text-[11px] text-slate-600">
            All physiological trajectory markers and risk probabilities represent statistical decision-support pre-analyses. Verified clinical diagnoses are executed exclusively by licensed medical practitioners at MediNexus Hospital.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
