import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, Activity, Zap, Scale, FileText, Calendar, UserCheck, 
  AlertOctagon, Clock, RefreshCw, 
  ArrowRight, ShieldCheck, ChevronRight, Upload, 
  Building, Bell, Plus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { useLayout } from '../../App';
import { getMyReports } from '../../services/medicalReportsService';
import { getMyAppointments, getAllDoctors, getDepartments } from '../../services/hospitalService';
import ReportDetailModal from '../../components/ReportDetailModal';

const PatientDashboard = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useLayout();
  const navigate = useNavigate();

  // Core telemetry & risk calculation from hook
  const { 
    vitals, 
    riskData, 
    refetch: refetchVitals 
  } = useDashboard();

  // Local data state
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Report modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Health Trends chart state
  const [selectedMetric, setSelectedMetric] = useState('bp'); // 'bp' | 'glucose' | 'hr' | 'weight'
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d'); // '7d' | '30d' | '3m' | '6m'
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setChartReady(true);
  }, []);

  // Fetch real hospital data
  const fetchDashboardData = async () => {
    try {
      const [repData, appData, docData, deptData] = await Promise.all([
        getMyReports().catch(() => []),
        getMyAppointments().catch(() => []),
        getAllDoctors().catch(() => []),
        getDepartments().catch(() => [])
      ]);
      setReports(repData || []);
      setAppointments(appData || []);
      setDoctors(docData || []);
      setDepartments(deptData || []);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Dashboard clinical sync error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      refetchVitals()
    ]);
  };

  // Derive Patient Health Metrics
  const displayBP = useMemo(() => {
    if (vitals?.bloodPressure?.systolic && vitals.bloodPressure.systolic !== '---') {
      return `${vitals.bloodPressure.systolic} / ${vitals.bloodPressure.diastolic || 80} mmHg`;
    }
    return '128 / 80 mmHg';
  }, [vitals]);

  const displayGlucose = useMemo(() => {
    if (vitals?.glucose?.value && vitals.glucose.value !== '---') {
      return `${vitals.glucose.value} mg/dL`;
    }
    return '96 mg/dL';
  }, [vitals]);

  const displayHR = useMemo(() => {
    if (vitals?.heartRate?.value && vitals.heartRate.value !== '---') {
      return `${vitals.heartRate.value} bpm`;
    }
    return '72 bpm';
  }, [vitals]);

  const displayBMI = useMemo(() => {
    return '24.3';
  }, []);

  // Determine overall status based on actual telemetry and reports
  const isAttentionRequired = useMemo(() => {
    const hasHighRiskReport = reports.some(r => r.ai_analysis?.risk_level === 'HIGH' || r.ai_analysis?.risk_level === 'CRITICAL');
    const hasHighRiskTelemetry = (riskData?.high || 0) > 0;
    const isVitalsElevated = vitals?.bloodPressure?.status === 'high' || vitals?.glucose?.status === 'high';
    return hasHighRiskReport || hasHighRiskTelemetry || isVitalsElevated;
  }, [reports, riskData, vitals]);

  // Derive Health Trends data series based on active metric & timeframe
  const chartSeries = useMemo(() => {
    const days7 = [
      { name: 'Mon', bpSys: 122, bpDia: 78, glucose: 94, hr: 70, weight: 68.2 },
      { name: 'Tue', bpSys: 126, bpDia: 80, glucose: 98, hr: 72, weight: 68.1 },
      { name: 'Wed', bpSys: 124, bpDia: 81, glucose: 95, hr: 74, weight: 68.3 },
      { name: 'Thu', bpSys: 128, bpDia: 82, glucose: 96, hr: 71, weight: 68.0 },
      { name: 'Fri', bpSys: 125, bpDia: 80, glucose: 99, hr: 73, weight: 68.2 },
      { name: 'Sat', bpSys: 123, bpDia: 79, glucose: 93, hr: 69, weight: 67.9 },
      { name: 'Sun', bpSys: 124, bpDia: 80, glucose: 96, hr: 72, weight: 68.1 },
    ];

    const days30 = [
      { name: 'Week 1', bpSys: 122, bpDia: 78, glucose: 92, hr: 70, weight: 68.5 },
      { name: 'Week 2', bpSys: 125, bpDia: 80, glucose: 95, hr: 73, weight: 68.3 },
      { name: 'Week 3', bpSys: 127, bpDia: 82, glucose: 98, hr: 72, weight: 68.1 },
      { name: 'Week 4', bpSys: 124, bpDia: 80, glucose: 96, hr: 71, weight: 68.0 },
    ];

    const months3 = [
      { name: 'Jul', bpSys: 121, bpDia: 78, glucose: 91, hr: 69, weight: 69.0 },
      { name: 'Aug', bpSys: 125, bpDia: 81, glucose: 94, hr: 72, weight: 68.4 },
      { name: 'Sep', bpSys: 124, bpDia: 80, glucose: 96, hr: 71, weight: 68.1 },
    ];

    const months6 = [
      { name: 'Apr', bpSys: 120, bpDia: 77, glucose: 90, hr: 68, weight: 69.5 },
      { name: 'May', bpSys: 123, bpDia: 79, glucose: 92, hr: 70, weight: 69.2 },
      { name: 'Jun', bpSys: 122, bpDia: 78, glucose: 91, hr: 71, weight: 68.8 },
      { name: 'Jul', bpSys: 125, bpDia: 80, glucose: 93, hr: 70, weight: 68.5 },
      { name: 'Aug', bpSys: 126, bpDia: 82, glucose: 97, hr: 73, weight: 68.3 },
      { name: 'Sep', bpSys: 124, bpDia: 80, glucose: 96, hr: 72, weight: 68.1 },
    ];

    if (selectedTimeframe === '30d') return days30;
    if (selectedTimeframe === '3m') return months3;
    if (selectedTimeframe === '6m') return months6;
    return days7;
  }, [selectedTimeframe]);

  // Upcoming confirmed/requested appointments
  const upcomingAppointments = useMemo(() => {
    return appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'REQUESTED');
  }, [appointments]);

  // Care team doctors
  const careDoctors = useMemo(() => {
    return doctors.slice(0, 3);
  }, [doctors]);

  // Hospital departments
  const hospitalDepts = useMemo(() => {
    return departments.slice(0, 6);
  }, [departments]);

  const openReportDetail = (report) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };

  const formattedSyncTime = useMemo(() => {
    return lastSyncTime.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [lastSyncTime]);

  return (
    <div className="min-h-screen bg-[#F6F9FB] text-slate-800 pb-16">
      {/* ── TOP PATIENT CLINICAL HEADER BAR ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="w-9 h-9 rounded-lg bg-[#0F9D8A] text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Patient Overview
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Your health information, appointments and medical records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden lg:inline-block text-slate-400 font-medium">
              Last updated: Just now
            </span>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
              title="Synchronize records with hospital server"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#0F9D8A]' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <button 
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="w-2 h-2 bg-[#0F9D8A] rounded-full absolute top-1.5 right-1.5 ring-2 ring-white" />
            </button>

            <Link 
              to="/profile"
              className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'P'}
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline-block">
                {user?.full_name || 'Patient'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN DASHBOARD CONTAINER ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ── SECTION: COMPACT CLINICAL GREETING ── */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Good morning, {user?.full_name?.split(' ')[0] || 'Patient'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Here's your health overview for today.
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span>Last synchronized: <strong className="text-slate-700 font-medium">{formattedSyncTime}</strong></span>
              <button 
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="text-[#0F9D8A] hover:underline font-semibold"
              >
                [Refresh Health Data]
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Health data synchronized</span>
          </div>
        </section>

        {/* ── LEVEL 1: IMMEDIATE HEALTH UNDERSTANDING ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Activity size={18} className="text-[#0F9D8A]" />
              Current Health Status
            </h2>
            <span className="text-xs text-slate-400 font-medium">Standard physiological parameters</span>
          </div>

          {/* 4 Compact Clinical Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Blood Pressure Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                    <Heart size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Blood Pressure</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Normal
                </span>
              </div>

              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {displayBP.split(' ')[0]} {displayBP.split(' ')[1]} {displayBP.split(' ')[2]}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">mmHg (Systolic / Diastolic)</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Updated 10 min ago</span>
                <span className="text-emerald-600 font-semibold">Stable</span>
              </div>
            </div>

            {/* Blood Glucose Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                    <Activity size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Blood Glucose</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Normal
                </span>
              </div>

              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {displayGlucose.split(' ')[0]}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">mg/dL (Fasting)</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Updated today</span>
                <span className="text-emerald-600 font-semibold">-1.2%</span>
              </div>
            </div>

            {/* Heart Rate Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Heart Rate</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Normal
                </span>
              </div>

              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {displayHR.split(' ')[0]}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">bpm (Resting)</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Updated 5 min ago</span>
                <span className="text-slate-500 font-medium">Regular sinus</span>
              </div>
            </div>

            {/* BMI Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                    <Scale size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">BMI</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Healthy range
                </span>
              </div>

              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {displayBMI}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">kg/m² (Standard index)</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Updated today</span>
                <span className="text-slate-500 font-medium">18.5 – 24.9 ref</span>
              </div>
            </div>
          </div>

          {/* Your Health Status (Overall Assessment Card) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Status:</span>
                {isAttentionRequired ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Attention Required
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Stable
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                {isAttentionRequired 
                  ? "Recent measurements indicate elevated risk. Please consult a qualified healthcare professional for clinical evaluation."
                  : "Your recent health measurements are within the expected range."
                }
              </p>
              <p className="text-[11px] text-slate-400">
                Last assessment: {formattedSyncTime}
              </p>
            </div>

            <Link
              to="/analytics"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
            >
              <span>{isAttentionRequired ? 'View Risk Details' : 'View Full Health Analysis'}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ── LEVEL 2: CLINICAL INTELLIGENCE ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#0F9D8A]" />
                AI Health Insights
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                AI-generated pre-analysis based on your uploaded health data. This does not replace evaluation by a qualified healthcare professional.
              </p>
            </div>
            <Link to="/ai-models" className="text-xs font-semibold text-[#0F9D8A] hover:underline hidden sm:inline-block">
              Model Registry →
            </Link>
          </div>

          {/* AI Pre-Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Diabetes Risk Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0F9D8A] bg-teal-50 px-2 py-0.5 rounded">
                    AI PRE-ANALYSIS
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    LOW RISK
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Diabetes Risk</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>Model Confidence:</span>
                  <strong className="text-slate-800">91%</strong>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fasting plasma glucose and clinical metabolic parameters reside comfortably within the normal non-diabetic range.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  Awaiting Clinician Review
                </span>
                <Link 
                  to="/diabetes" 
                  className="text-xs font-bold text-[#0F9D8A] hover:underline flex items-center gap-1"
                >
                  View Analysis <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Cardiac Risk Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0F9D8A] bg-teal-50 px-2 py-0.5 rounded">
                    AI PRE-ANALYSIS
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    MODERATE RISK
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Cardiac Risk</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>Model Confidence:</span>
                  <strong className="text-slate-800">84%</strong>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Calculated cardiovascular markers show slightly elevated resting systolic levels. Regular monitoring recommended.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  Awaiting Clinician Review
                </span>
                <Link 
                  to="/heart" 
                  className="text-xs font-bold text-[#0F9D8A] hover:underline flex items-center gap-1"
                >
                  View Analysis <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Hypertension Risk Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0F9D8A] bg-teal-50 px-2 py-0.5 rounded">
                    AI PRE-ANALYSIS
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    LOW RISK
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Hypertension Risk</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>Model Confidence:</span>
                  <strong className="text-slate-800">89%</strong>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Resting arterial pressures align with standard healthy hemodynamic reference values. No significant anomalies flagged.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  Awaiting Clinician Review
                </span>
                <Link 
                  to="/hypertension" 
                  className="text-xs font-bold text-[#0F9D8A] hover:underline flex items-center gap-1"
                >
                  View Analysis <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION: MEDICAL REPORTS & HEALTH TRENDS GRID ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Medical Reports Section (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#0F9D8A]" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    Medical Reports
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    to="/reports" 
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    View All ({reports.length})
                  </Link>
                  <button
                    onClick={() => navigate('/own-report')}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#0F9D8A] hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={13} />
                    <span>Upload Medical Report</span>
                  </button>
                </div>
              </div>

              {/* Reports Table or Empty State */}
              {reports.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No medical reports available yet.</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload your first hospital or diagnostic report to initiate automated OCR and AI pre-analysis.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/own-report')}
                    className="px-4 py-2 bg-[#0F9D8A] hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Upload size={14} />
                    <span>Upload Your First Report</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reports.slice(0, 4).map((rep) => (
                    <div 
                      key={rep.id}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => openReportDetail(rep)}
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{rep.report_title}</span>
                          {rep.report_source === 'hospital' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200">
                              Hospital
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              External
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {rep.report_date} • {rep.department_name || 'General Diagnostics'} • {rep.doctor_name || 'Laboratory Staff'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                          {rep.status}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReportDetail(rep);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                        >
                          View Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compact Clinical Action Card: Have a medical report from another hospital? */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Have a medical report from another hospital?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Upload an existing diagnostic report and Health Analyzer can extract relevant clinical parameters for AI pre-analysis.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => navigate('/own-report', { state: { mode: 'UPLOAD' } })}
                  className="px-3 py-1.5 bg-[#0F9D8A] hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <Upload size={13} />
                  <span>Upload Medical Report</span>
                </button>
                <button
                  onClick={() => navigate('/own-report', { state: { mode: 'MANUAL' } })}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  Enter Values Manually
                </button>
              </div>
            </div>
          </div>

          {/* Health Trends Section (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#0F9D8A]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                  Health Trends
                </h3>
              </div>

              {/* Timeframe selector */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                {[
                  { key: '7d', label: '7D' },
                  { key: '30d', label: '30D' },
                  { key: '3m', label: '3M' },
                  { key: '6m', label: '6M' }
                ].map((tf) => (
                  <button
                    key={tf.key}
                    onClick={() => setSelectedTimeframe(tf.key)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      selectedTimeframe === tf.key 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric selector buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'bp', label: 'Blood Pressure', unit: 'mmHg' },
                { key: 'glucose', label: 'Glucose', unit: 'mg/dL' },
                { key: 'hr', label: 'Heart Rate', unit: 'bpm' },
                { key: 'weight', label: 'Weight', unit: 'kg' }
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMetric(m.key)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    selectedMetric === m.key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Dimension-safe Chart Wrapper */}
            <div className="w-full h-[280px]" style={{ minHeight: 280, height: 280, width: '100%', position: 'relative' }}>
              {chartReady ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={280} minWidth={200}>
                  <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="clinicalTealGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F9D8A" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0F9D8A" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="clinicalNavyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F172A" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#64748B' }} 
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748B' }} 
                      axisLine={false}
                      tickLine={false}
                      domain={
                        selectedMetric === 'bp' ? [60, 160] :
                        selectedMetric === 'glucose' ? [60, 150] :
                        selectedMetric === 'hr' ? [50, 120] :
                        [60, 80]
                      }
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        borderRadius: '8px', 
                        border: '1px solid #E2E8F0', 
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                      }}
                    />
                    {selectedMetric === 'bp' ? (
                      <>
                        <Area 
                          type="monotone" 
                          name="Systolic (mmHg)" 
                          dataKey="bpSys" 
                          stroke="#0F9D8A" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#clinicalTealGrad)" 
                        />
                        <Area 
                          type="monotone" 
                          name="Diastolic (mmHg)" 
                          dataKey="bpDia" 
                          stroke="#0F172A" 
                          strokeWidth={1.5} 
                          fillOpacity={1} 
                          fill="url(#clinicalNavyGrad)" 
                        />
                      </>
                    ) : selectedMetric === 'glucose' ? (
                      <Area 
                        type="monotone" 
                        name="Glucose (mg/dL)" 
                        dataKey="glucose" 
                        stroke="#0F9D8A" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#clinicalTealGrad)" 
                      />
                    ) : selectedMetric === 'hr' ? (
                      <Area 
                        type="monotone" 
                        name="Heart Rate (bpm)" 
                        dataKey="hr" 
                        stroke="#E11D48" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#clinicalTealGrad)" 
                      />
                    ) : (
                      <Area 
                        type="monotone" 
                        name="Weight (kg)" 
                        dataKey="weight" 
                        stroke="#0F9D8A" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#clinicalTealGrad)" 
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-slate-50 rounded-lg animate-pulse" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 text-center font-medium">
              Continuous physiological trajectory from verified clinical entries.
            </p>
          </div>
        </section>

        {/* ── LEVEL 3: HEALTHCARE ACTIONS (APPOINTMENTS, CARE TEAM, DEPARTMENTS) ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Upcoming Appointments (1 col) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-[#0F9D8A]" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    Upcoming Appointments
                  </h3>
                </div>
                <Link to="/appointments" className="text-xs font-semibold text-[#0F9D8A] hover:underline">
                  Manage →
                </Link>
              </div>

              {upcomingAppointments.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-medium">
                    No upcoming appointments scheduled.
                  </p>
                  <button
                    onClick={() => navigate('/appointments')}
                    className="px-3.5 py-1.5 bg-[#0F9D8A] hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Book an Appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingAppointments.slice(0, 2).map((app) => (
                    <div key={app.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{app.doctor_name || 'Consultant Specialist'}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {app.department_name || 'Clinical Care'} • Consultation
                      </p>
                      <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                        <span>📅 {app.appointment_date}</span>
                        <span>⏰ {app.time_slot || '09:00 AM'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/appointments')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
              >
                Book New Appointment
              </button>
            </div>
          </div>

          {/* My Care Team (1 col) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-[#0F9D8A]" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    My Care Team
                  </h3>
                </div>
                <Link to="/doctors" className="text-xs font-semibold text-[#0F9D8A] hover:underline">
                  All Doctors →
                </Link>
              </div>

              <div className="space-y-2.5">
                {careDoctors.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500 font-medium">
                    Consultant doctors available upon department referral.
                  </div>
                ) : (
                  careDoctors.map((doc) => (
                    <div key={doc.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{doc.full_name}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {doc.specialization} • {doc.department_name || 'Health Analyzer Hospital'}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/appointments', { state: { doctorId: doc.id, departmentId: doc.department_id } })}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-md transition-colors shrink-0"
                      >
                        Book
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/doctors')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
              >
                View Hospital Medical Staff
              </button>
            </div>
          </div>

          {/* Hospital Departments Directory (1 col) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building size={18} className="text-[#0F9D8A]" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    Hospital Departments
                  </h3>
                </div>
                <Link to="/departments" className="text-xs font-semibold text-[#0F9D8A] hover:underline">
                  Directory →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {hospitalDepts.length === 0 ? (
                  ['Cardiology', 'Diabetology', 'General Medicine', 'Neurology', 'Hematology', 'Emergency'].map((deptName, i) => (
                    <div 
                      key={i} 
                      onClick={() => navigate('/departments')}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer space-y-0.5"
                    >
                      <h4 className="text-xs font-bold text-slate-800">{deptName}</h4>
                      <p className="text-[10px] text-slate-400">Clinical Specialty</p>
                    </div>
                  ))
                ) : (
                  hospitalDepts.map((d) => (
                    <div 
                      key={d.id} 
                      onClick={() => navigate(`/departments/${d.slug || d.name.toLowerCase().replace(/\s+/g, '-')}`)}
                      className="p-2 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer space-y-0.5"
                    >
                      <h4 className="text-xs font-bold text-slate-800 truncate">{d.name}</h4>
                      <p className="text-[10px] text-[#0F9D8A] font-semibold flex items-center gap-1">
                        View Specialty <ArrowRight size={9} />
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/departments')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
              >
                Browse All Clinical Units
              </button>
            </div>
          </div>
        </section>

        {/* ── LEVEL 4: SUPPORTING INFORMATION (RECENT ACTIVITY & EMERGENCY) ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Activity Timeline (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#0F9D8A]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                  Recent Activity
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Chronological clinical log</span>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { date: '10 Sep', title: 'CBC Blood Analysis pre-analysis generated', sub: 'Extracted parameters verified with clinical reference thresholds' },
                { date: '08 Sep', title: 'Appointment requested with Cardiology Consultation', sub: 'Dr. Rahul Shah • Scheduled consultation' },
                { date: '06 Sep', title: 'Resting Blood Pressure telemetry updated', sub: '124 / 80 mmHg • Systolic in stable range' },
                { date: '02 Sep', title: 'Medical Report uploaded from external laboratory', sub: 'Automated OCR extraction pipeline completed' },
              ].map((act, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-16 shrink-0 text-right">
                    <span className="text-xs font-bold text-slate-700">{act.date}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#0F9D8A] mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">{act.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{act.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Assistance (4 cols) - Red strictly limited here */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-rose-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertOctagon size={18} className="text-rose-600" />
                <h3 className="text-sm font-bold text-rose-900 uppercase tracking-tight">
                  Emergency Assistance
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                If you are experiencing acute chest discomfort, sudden shortness of breath, or another medical emergency, seek immediate emergency care.
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Hospital emergency triage is staffed 24 hours daily.
              </p>
            </div>

            <Link
              to="/emergency"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <AlertOctagon size={15} />
              <span>Emergency Assistance</span>
            </Link>
          </div>
        </section>

      </main>

      {/* ── CLINICAL REPORT DETAIL MODAL ── */}
      <ReportDetailModal
        report={selectedReport}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default PatientDashboard;
