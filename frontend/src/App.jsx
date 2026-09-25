import React, { useState, createContext, useContext, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from "./context/NotificationContext";
import NotificationContainer from "./components/Notifications/NotificationContainer";
import Sidebar from './components/Sidebar';
import ChatbotDrawer from './components/Chatbot/ChatbotDrawer';
import { ReportProvider } from './context/ReportContext';
import AnimatedLoader from './components/AnimatedLoader';
import './App.css';

// Lazy-loaded Page Routes for Performance Optimization
const Landing = lazy(() => import('./pages/Landing'));
const PatientLogin = lazy(() => import('./pages/patient/PatientLogin'));
const DoctorLogin = lazy(() => import('./pages/doctor/DoctorLogin'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Diabetes = lazy(() => import('./pages/Diabetes'));
const Heart = lazy(() => import('./pages/Heart'));
const Hypertension = lazy(() => import('./pages/Hypertension'));
const Profile = lazy(() => import('./pages/Profile'));
const History = lazy(() => import('./pages/History'));
const CBC = lazy(() => import('./pages/CBC'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const MLStudio = lazy(() => import('./pages/MLStudio'));


const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const MyReports = lazy(() => import('./pages/patient/MyReports'));
const Appointments = lazy(() => import('./pages/patient/Appointments'));
const EmergencyPage = lazy(() => import('./pages/patient/EmergencyPage'));
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorReports = lazy(() => import('./pages/doctor/DoctorReports'));
const DoctorAppointments = lazy(() => import('./pages/doctor/DoctorAppointments'));
const DoctorPatientView = lazy(() => import('./pages/doctor/DoctorPatientView'));
const DepartmentsPage = lazy(() => import('./pages/departments/DepartmentsPage'));
const AIModelsPage = lazy(() => import('./pages/patient/AIModelsPage'));
const OwnReportFlow = lazy(() => import('./pages/patient/OwnReportFlow'));
const DoctorsPage = lazy(() => import('./pages/patient/DoctorsPage'));
const AnalyticsPage = lazy(() => import('./pages/patient/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/patient/SettingsPage'));

const LayoutContext = createContext();
export const useLayout = () => useContext(LayoutContext);

// ─── Portal Route Guards ─────────────────────────────────────────────────────

const PatientProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/patient/login" replace />;
  const role = (user.role || '').toLowerCase();
  if (role === 'doctor' || role === 'emergency_doctor') {
    return <Navigate to="/doctor/dashboard" replace />;
  }
  if (role === 'admin' || role === 'hospital_admin' || role === 'department_admin') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

const DoctorProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/doctor/login" replace />;
  const role = (user.role || '').toLowerCase();
  if (role === 'admin' || role === 'hospital_admin' || role === 'department_admin') {
    return <Navigate to="/admin" replace />;
  }
  if (role !== 'doctor' && role !== 'emergency_doctor') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  const role = (user.role || '').toLowerCase();
  if (role === 'doctor' || role === 'emergency_doctor') {
    return <Navigate to="/doctor/dashboard" replace />;
  }
  if (role !== 'admin' && role !== 'hospital_admin' && role !== 'department_admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const CommonProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    const path = window.location.pathname;
    if (path.startsWith('/doctor')) return <Navigate to="/doctor/login" replace />;
    if (path.startsWith('/admin')) return <Navigate to="/admin/login" replace />;
    return <Navigate to="/patient/login" replace />;
  }
  return children;
};

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <LayoutContext.Provider value={{ toggleSidebar }}>
      <div className="flex h-screen w-full bg-[#F6F9FB] overflow-hidden relative">
        {/* Sidebar - Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Container with its own independent scroll */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 h-screen shrink-0 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64 bg-white border-r border-slate-200 overflow-hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Main Content Area with its own independent scroll */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0 bg-[#F6F9FB]">
          <main className="flex-1 overflow-y-auto overflow-x-hidden w-full bg-[#F6F9FB]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full min-h-full flex flex-col bg-[#F6F9FB]"
            >
              {children}
            </motion.div>
          </main>
          <ChatbotDrawer />
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

function App() {
  return (
    <NotificationProvider>
      <NotificationContainer />
      <AuthProvider>
        <ReportProvider>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
              <AnimatedLoader size="lg" message="Loading Health Analyzer Platform..." />
            </div>
          }>
            <Routes>
              {/* Public Marketing & Gateway Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/patient/login" element={<PatientLogin />} />
              <Route path="/doctor/login" element={<DoctorLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Legacy /login Route Redirect */}
              <Route path="/login" element={<Navigate to="/patient/login" replace />} />

              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Patient Routes */}
              <Route path="/dashboard" element={<PatientProtectedRoute><DashboardLayout><PatientDashboard /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/reports" element={<PatientProtectedRoute><DashboardLayout><MyReports /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/my-reports" element={<PatientProtectedRoute><DashboardLayout><MyReports /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/own-report" element={<PatientProtectedRoute><DashboardLayout><OwnReportFlow /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/appointments" element={<PatientProtectedRoute><DashboardLayout><Appointments /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/doctors" element={<PatientProtectedRoute><DashboardLayout><DoctorsPage /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/analytics" element={<PatientProtectedRoute><DashboardLayout><AnalyticsPage /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/diabetes" element={<PatientProtectedRoute><DashboardLayout><Diabetes /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/heart" element={<PatientProtectedRoute><DashboardLayout><Heart /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/hypertension" element={<PatientProtectedRoute><DashboardLayout><Hypertension /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/cbc" element={<PatientProtectedRoute><DashboardLayout><CBC /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/history" element={<PatientProtectedRoute><DashboardLayout><History /></DashboardLayout></PatientProtectedRoute>} />
              <Route path="/report-history" element={<PatientProtectedRoute><DashboardLayout><History /></DashboardLayout></PatientProtectedRoute>} />

              {/* Doctor Routes */}
              <Route path="/doctor/dashboard" element={<DoctorProtectedRoute><DashboardLayout><DoctorDashboard /></DashboardLayout></DoctorProtectedRoute>} />
              <Route path="/doctor/appointments" element={<DoctorProtectedRoute><DashboardLayout><DoctorAppointments /></DashboardLayout></DoctorProtectedRoute>} />
              <Route path="/doctor/patients/:patientId" element={<DoctorProtectedRoute><DashboardLayout><DoctorPatientView /></DashboardLayout></DoctorProtectedRoute>} />
              <Route path="/doctor/reports" element={<DoctorProtectedRoute><DashboardLayout><DoctorReports /></DashboardLayout></DoctorProtectedRoute>} />

              {/* Shared Clinical & Account Services */}
              <Route path="/departments" element={<CommonProtectedRoute><DashboardLayout><DepartmentsPage /></DashboardLayout></CommonProtectedRoute>} />
              <Route path="/departments/:deptSlug" element={<CommonProtectedRoute><DashboardLayout><DepartmentsPage /></DashboardLayout></CommonProtectedRoute>} />
              <Route path="/emergency" element={<CommonProtectedRoute><DashboardLayout><EmergencyPage /></DashboardLayout></CommonProtectedRoute>} />
              <Route path="/ai-models" element={<CommonProtectedRoute><DashboardLayout><AIModelsPage /></DashboardLayout></CommonProtectedRoute>} />
              <Route path="/ml-studio" element={<CommonProtectedRoute><DashboardLayout><MLStudio /></DashboardLayout></CommonProtectedRoute>} />
              <Route path="/profile" element={<CommonProtectedRoute><DashboardLayout><Profile /></DashboardLayout></CommonProtectedRoute>} />
              <Route path="/settings" element={<CommonProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></CommonProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminPage /></AdminProtectedRoute>} />
              <Route path="/admin/*" element={<AdminProtectedRoute><AdminPage /></AdminProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ReportProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
