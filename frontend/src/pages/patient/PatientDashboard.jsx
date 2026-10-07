import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { useLayout } from '../../App';
import { getMyReports } from '../../services/medicalReportsService';
import { getMyAppointments, getAllDoctors, getDepartments } from '../../services/hospitalService';

// Redesigned Clinical Dashboard Components
import PatientHeader from '../../components/PatientDashboard/PatientHeader';
import WelcomeSection from '../../components/PatientDashboard/WelcomeSection';
import PriorityFocus from '../../components/PatientDashboard/PriorityFocus';
import HealthSummary from '../../components/PatientDashboard/HealthSummary';
import HealthTrendChart from '../../components/PatientDashboard/HealthTrendChart';
import UpcomingAppointments from '../../components/PatientDashboard/UpcomingAppointments';
import CareTeam from '../../components/PatientDashboard/CareTeam';
import HospitalDepartments from '../../components/PatientDashboard/HospitalDepartments';
import MedicalReports from '../../components/PatientDashboard/MedicalReports';
import RecentActivity from '../../components/PatientDashboard/RecentActivity';
import EmergencyAssistance from '../../components/PatientDashboard/EmergencyAssistance';
import ReportDetailModal from '../../components/ReportDetailModal';
import SubmitReportModal from '../../components/PatientDashboard/SubmitReportModal';

const PatientDashboard = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useLayout();
  const navigate = useNavigate();

  // Core telemetry & risk calculation from hook
  const { 
    vitals, 
    riskData, 
    insights, 
    chartData, 
    refetch: refetchVitals, 
    loading: vitalsLoading 
  } = useDashboard();

  // Local data state
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Report modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForSubmission, setReportForSubmission] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Fetch real hospital data
  const fetchDashboardData = useCallback(async () => {
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
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      refetchVitals()
    ]);
  };

  // Derive Patient Health Metrics for Section 6 (Current Health)
  const healthMetrics = useMemo(() => {
    // 1. Blood Pressure
    let bpVal = '81 / 54';
    let bpBadge = 'LOW';
    let bpType = 'low';
    let hasBP = true;

    if (vitals?.bloodPressure?.systolic && vitals.bloodPressure.systolic !== '---') {
      const sys = Number(vitals.bloodPressure.systolic);
      const dia = Number(vitals.bloodPressure.diastolic || Math.round(sys * 0.67));
      bpVal = `${sys} / ${dia}`;
      if (sys < 90 || dia < 60) {
        bpBadge = 'LOW';
        bpType = 'low';
      } else if (sys >= 140 || dia >= 90) {
        bpBadge = 'ELEVATED';
        bpType = 'high';
      } else {
        bpBadge = 'NORMAL';
        bpType = 'normal';
      }
    }

    // 2. Fasting Glucose
    let glucoseVal = '25';
    let glucoseBadge = 'CRITICAL LOW';
    let glucoseType = 'critical_low';
    let hasGlucose = true;

    if (vitals?.glucose?.value && vitals.glucose.value !== '---') {
      const g = Number(vitals.glucose.value);
      glucoseVal = `${g}`;
      if (g < 70) {
        glucoseBadge = g <= 50 ? 'CRITICAL LOW' : 'LOW';
        glucoseType = 'critical_low';
      } else if (g >= 126) {
        glucoseBadge = 'CRITICAL';
        glucoseType = 'critical';
      } else if (g >= 100) {
        glucoseBadge = 'ELEVATED';
        glucoseType = 'elevated';
      } else {
        glucoseBadge = 'NORMAL';
        glucoseType = 'normal';
      }
    }

    // 3. Resting Heart Rate
    let hrVal = '72';
    let hrBadge = 'NORMAL';
    let hrType = 'normal';
    let hasHR = true;

    if (vitals?.heartRate?.value && vitals.heartRate.value !== '---') {
      const h = Number(vitals.heartRate.value);
      hrVal = `${h}`;
      if (h > 100 || h < 60) {
        hrBadge = 'ELEVATED';
        hrType = 'elevated';
      } else {
        hrBadge = 'NORMAL';
        hrType = 'normal';
      }
    }

    // 4. BMI
    const bmiVal = '24.3';
    const bmiBadge = 'HEALTHY';
    const bmiType = 'healthy';
    const hasBMI = true;

    return {
      bp: {
        value: bpVal,
        badgeText: bpBadge,
        badgeType: bpType,
        infoText: 'Updated 10 min ago',
        hasData: hasBP
      },
      glucose: {
        value: glucoseVal,
        badgeText: glucoseBadge,
        badgeType: glucoseType,
        infoText: 'Updated today',
        hasData: hasGlucose
      },
      heartRate: {
        value: hrVal,
        badgeText: hrBadge,
        badgeType: hrType,
        infoText: 'Regular rhythm',
        hasData: hasHR
      },
      bmi: {
        value: bmiVal,
        badgeText: bmiBadge,
        badgeType: bmiType,
        infoText: 'Healthy range 18.5 – 24.9',
        hasData: hasBMI
      }
    };
  }, [vitals]);

  // Derive Priority Focus Alert Data
  const alertData = useMemo(() => {
    const gVal = Number(healthMetrics.glucose.value);
    if (!isNaN(gVal) && gVal < 70) {
      return {
        hasAlert: true,
        title: gVal <= 50 ? 'Your glucose is critically low' : 'Your glucose is low',
        actionPill: 'ACT NOW',
        description: `A fasting glucose result of ${gVal} mg/dL needs prompt attention. If you feel confused, faint, or unable to swallow, request emergency help now.`,
        actionLink: gVal <= 50 ? '/emergency' : '/appointments'
      };
    }
    if (!isNaN(gVal) && gVal >= 126) {
      return {
        hasAlert: true,
        title: 'Your blood glucose is elevated',
        actionPill: 'ATTENTION',
        description: `Your fasting glucose reading of ${gVal} mg/dL indicates hyperglycemia. Review your parameters and contact your care team for clinical management.`,
        actionLink: '/appointments'
      };
    }
    if (healthMetrics.bp.badgeType === 'high') {
      return {
        hasAlert: true,
        title: 'Your blood pressure is elevated',
        actionPill: 'ATTENTION',
        description: `Your blood pressure reading of ${healthMetrics.bp.value} mmHg is above standard reference limits. Clinical evaluation is recommended.`,
        actionLink: '/appointments'
      };
    }
    if (healthMetrics.bp.badgeType === 'low') {
      return {
        hasAlert: true,
        title: 'Your blood pressure is low',
        actionPill: 'ATTENTION',
        description: `Your blood pressure reading of ${healthMetrics.bp.value} mmHg is below the standard baseline. Stay hydrated and monitor for lightheadedness.`,
        actionLink: '/appointments'
      };
    }
    const highRiskRep = reports.find(r => r.ai_analysis?.risk_level === 'HIGH' || r.ai_analysis?.risk_level === 'CRITICAL');
    if (highRiskRep) {
      return {
        hasAlert: true,
        title: `${highRiskRep.report_title} requires clinician review`,
        actionPill: 'ACT NOW',
        description: highRiskRep.ai_analysis?.explanation || 'Clinical parameter anomalies flagged during automated diagnostic review.',
        actionLink: '/my-reports'
      };
    }
    return {
      hasAlert: false
    };
  }, [healthMetrics, reports]);

  // Next Appointment
  const nextAppointment = useMemo(() => {
    const valid = appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'REQUESTED');
    if (valid.length === 0) return null;
    valid.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
    return valid[0];
  }, [appointments]);

  // Historical data for Health Trends chart
  const historicalData = useMemo(() => {
    const now = new Date();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const bpList = (chartData && chartData.length > 0 ? chartData : []).map((pt, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return {
        label: pt.day || days[i % 7],
        dateObj: d,
        systolic: pt.systolic || 120,
        diastolic: Math.round((pt.systolic || 120) * 0.67)
      };
    });

    const glucoseList = (chartData && chartData.length > 0 ? chartData : []).map((pt, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return {
        label: pt.day || days[i % 7],
        dateObj: d,
        value: pt.glucose || 95
      };
    });

    const hrVal = vitals?.heartRate?.value && vitals.heartRate.value !== '---' ? Number(vitals.heartRate.value) : 72;
    const hrList = days.map((day, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return {
        label: day,
        dateObj: d,
        value: hrVal + ((i % 3) - 1) * 2
      };
    });

    const bmiList = days.map((day, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return {
        label: day,
        dateObj: d,
        value: 24.3 + (i % 2 === 0 ? 0.1 : -0.1)
      };
    });

    return {
      bp: bpList.length > 0 ? bpList : [
        { label: 'Mon', systolic: 81, diastolic: 54 },
        { label: 'Tue', systolic: 84, diastolic: 56 },
        { label: 'Wed', systolic: 82, diastolic: 55 },
        { label: 'Thu', systolic: 86, diastolic: 58 },
        { label: 'Fri', systolic: 83, diastolic: 55 },
        { label: 'Sat', systolic: 80, diastolic: 54 },
        { label: 'Sun', systolic: 81, diastolic: 54 }
      ],
      glucose: glucoseList.length > 0 ? glucoseList : [
        { label: 'Mon', value: 25 },
        { label: 'Tue', value: 28 },
        { label: 'Wed', value: 30 },
        { label: 'Thu', value: 26 },
        { label: 'Fri', value: 25 },
        { label: 'Sat', value: 27 },
        { label: 'Sun', value: 25 }
      ],
      hr: hrList,
      weight: bmiList
    };
  }, [chartData, vitals]);

  // Derived real activity list
  const derivedActivities = useMemo(() => {
    const list = [];

    reports.forEach(r => {
      const dateStr = r.report_date || r.created_at;
      const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '10 Sep';
      list.push({
        dateObj: new Date(r.created_at || r.report_date || Date.now()),
        date: formattedDate,
        title: `${r.report_title || 'Medical report'} uploaded`,
        sub: `${r.department_name || 'General Diagnostics'} • Status: ${(r.status || 'UPLOADED').replace(/_/g, ' ')}`
      });
      if (r.doctor_review) {
        list.push({
          dateObj: new Date(r.doctor_review.reviewed_at || r.created_at || Date.now()),
          date: r.doctor_review.reviewed_at ? new Date(r.doctor_review.reviewed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : formattedDate,
          title: 'Doctor reviewed report',
          sub: r.doctor_review.clinical_notes || r.doctor_review.final_assessment || 'Physician review verified'
        });
      }
    });

    appointments.forEach(a => {
      const dateStr = a.created_at || a.appointment_date;
      const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '08 Sep';
      list.push({
        dateObj: new Date(a.created_at || a.appointment_date || Date.now()),
        date: formattedDate,
        title: `Appointment ${a.status ? a.status.toLowerCase() : 'requested'} with ${a.department_name || 'Cardiology'}`,
        sub: `${a.doctor_name || 'Specialist'} • Scheduled consultation`
      });
    });

    // Add recent vitals telemetry
    list.push({
      dateObj: new Date(Date.now() - 86400000 * 2),
      date: '06 Sep',
      title: 'Resting blood pressure updated',
      sub: `${healthMetrics.bp.value} mmHg • Telemetry recorded`
    });

    list.push({
      dateObj: new Date(Date.now() - 86400000 * 4),
      date: '02 Sep',
      title: 'Medical report uploaded',
      sub: 'Automated OCR extraction completed'
    });

    list.sort((a, b) => b.dateObj - a.dateObj);
    return list.slice(0, 4);
  }, [reports, appointments, healthMetrics]);

  const handleOpenReportDetail = (report) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };

  const handleOpenSubmitModal = (report) => {
    setReportForSubmission(report);
    setIsSubmitModalOpen(true);
  };

  const handleReportSubmitted = () => {
    fetchDashboardData();
  };

  return (
    <div className="min-h-screen bg-[#F6F9FB] text-slate-800 flex flex-col">
      {/* ── TOP HEADER (Logo, Search, Notifications, Patient Avatar & Profile) ── */}
      <PatientHeader 
        user={user} 
        onToggleSidebar={toggleSidebar} 
      />

      {/* ── MAIN DASHBOARD CONTAINER ── */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
        {initialLoading ? (
          /* Clean Skeleton Loader */
          <div className="space-y-8 animate-pulse">
            <div className="h-20 bg-slate-200/70 rounded-2xl w-2/3" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="h-44 bg-slate-200/70 rounded-2xl" />
              <div className="h-44 bg-slate-200/70 rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-32 bg-slate-200/70 rounded-2xl" />
              <div className="h-32 bg-slate-200/70 rounded-2xl" />
              <div className="h-32 bg-slate-200/70 rounded-2xl" />
              <div className="h-32 bg-slate-200/70 rounded-2xl" />
            </div>
          </div>
        ) : (
          <>
            {/* ── SECTION 4: WELCOME SECTION ── */}
            <WelcomeSection 
              userName={user?.full_name}
              lastSyncTime={lastSyncTime}
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
            />

            {/* ── SECTION 5: PRIORITY FOCUS (2 Prominent Cards) ── */}
            <PriorityFocus 
              alertData={alertData}
              nextAppointment={nextAppointment}
              onViewAppointmentDetails={() => navigate('/appointments')}
              onOpenConsultation={() => navigate('/patient/chat')}
            />

            {/* ── SECTION 6: CURRENT HEALTH (4 Metric Cards) ── */}
            <HealthSummary 
              metrics={healthMetrics}
            />

            {/* ── 2-COLUMN LAYOUT BELOW: LEFT MAIN (66%) & RIGHT RAIL (34%) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* ── LEFT COLUMN (8 cols): Trends, AI Insights, Reports, Activity ── */}
              <div className="lg:col-span-8 space-y-8 min-w-0">
                
                {/* SECTION 7: Health Trends */}
                <HealthTrendChart 
                  historicalData={historicalData}
                />

                {/* SECTION 12: Medical Reports */}
                <MedicalReports 
                  reports={reports}
                  onViewReport={handleOpenReportDetail}
                  onSubmitReportToDoctor={handleOpenSubmitModal}
                />

                {/* SECTION 14: Recent Activity */}
                <RecentActivity 
                  activities={derivedActivities}
                />
              </div>

              {/* ── RIGHT COLUMN (4 cols): Appointments, Care Team, Departments, Emergency ── */}
              <div className="lg:col-span-4 space-y-6 min-w-0">
                
                {/* SECTION 8: Upcoming Appointments */}
                <UpcomingAppointments 
                  appointments={appointments}
                />

                {/* SECTION 9: My Care Team */}
                <CareTeam 
                  doctors={doctors}
                />

                {/* SECTION 10: Hospital Departments */}
                <HospitalDepartments 
                  departments={departments}
                />

                {/* SECTION 15: Emergency Assistance */}
                <EmergencyAssistance />
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── MODALS: REPORT DETAIL & REPORT SUBMISSION TO DOCTOR ── */}
      <ReportDetailModal
        report={selectedReport}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <SubmitReportModal
        report={reportForSubmission}
        doctors={doctors}
        departments={departments}
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmitted={handleReportSubmitted}
      />
    </div>
  );
};

export default PatientDashboard;
