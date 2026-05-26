import React, { useState, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from "./context/NotificationContext";
import NotificationContainer from "./components/Notifications/NotificationContainer";
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Diabetes from './pages/Diabetes';
import Heart from './pages/Heart';
import Hypertension from './pages/Hypertension';
import Profile from './pages/Profile';
import History from './pages/History';
import CBC from './pages/CBC';
import AdminPage from './pages/AdminPage';
import MLStudio from './pages/MLStudio';
import { ReportProvider } from './context/ReportContext';
import './App.css';

const LayoutContext = createContext();
export const useLayout = () => useContext(LayoutContext);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'admin' || user?.is_admin || user?.email?.includes('admin')) {
    return <Navigate to="/admin" replace />;
  }
  return <Dashboard />;
};

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <LayoutContext.Provider value={{ toggleSidebar }}>
      <div className="flex min-h-screen bg-[#F7FAFC] relative overflow-hidden">
        {/* Sidebar - Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </main>
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
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardRedirect /></DashboardLayout></ProtectedRoute>} />
            <Route path="/diabetes" element={<ProtectedRoute><DashboardLayout><Diabetes /></DashboardLayout></ProtectedRoute>} />
            <Route path="/heart" element={<ProtectedRoute><DashboardLayout><Heart /></DashboardLayout></ProtectedRoute>} />
            <Route path="/hypertension" element={<ProtectedRoute><DashboardLayout><Hypertension /></DashboardLayout></ProtectedRoute>} />
            <Route path="/cbc" element={<ProtectedRoute><DashboardLayout><CBC /></DashboardLayout></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><DashboardLayout><History /></DashboardLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/ml-studio" element={<ProtectedRoute><DashboardLayout><MLStudio /></DashboardLayout></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ReportProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
