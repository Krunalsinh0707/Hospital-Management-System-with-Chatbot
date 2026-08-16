import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Activity, Heart, FileText, Clock, User, X, LogOut, 
  Cpu, ShieldCheck, Thermometer, Database, Brain, Sparkles, Bot, Layers,
  UserCheck, BarChart3, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'patient';
  const isDoctor = role === 'doctor' || role === 'emergency_doctor';
  const isAdmin = role === 'admin' || role === 'hospital_admin' || role === 'department_admin';

  let mainItems = [];
  let hospitalItems = [];
  let reportItems = [];
  let aiItems = [];
  let systemItems = [];

  if (isDoctor) {
    mainItems = [
      { path: '/doctor/dashboard', name: 'Clinical Overview', icon: <LayoutDashboard size={18} /> },
    ];
    hospitalItems = [
      { path: '/doctor/reports', name: 'AI Decision & Review', icon: <ShieldCheck size={18} /> },
      { path: '/appointments', name: 'Consultations', icon: <Clock size={18} /> },
      { path: '/emergency', name: 'Emergency Queue', icon: <Activity size={18} /> },
      { path: '/departments', name: 'Departments', icon: <Database size={18} /> },
    ];
    reportItems = [
      { path: '/my-reports', name: 'Patient Medical Records', icon: <FileText size={18} /> },
    ];
    aiItems = [
      { path: '/ai-models', name: 'Model Registry', icon: <Layers size={18} /> },
      { path: '/ml-studio', name: 'Neural Studio', icon: <Cpu size={18} /> },
    ];
  } else if (isAdmin) {
    mainItems = [
      { path: '/dashboard', name: 'Hospital Overview', icon: <LayoutDashboard size={18} /> },
      { path: '/admin', name: 'System Control', icon: <Database size={18} /> },
    ];
    hospitalItems = [
      { path: '/departments', name: 'Departments', icon: <Database size={18} /> },
      { path: '/emergency', name: 'Emergency Queue', icon: <Activity size={18} /> },
    ];
    reportItems = [
      { path: '/my-reports', name: 'Medical Records', icon: <FileText size={18} /> },
    ];
    aiItems = [
      { path: '/ai-models', name: 'AI Model Registry', icon: <Layers size={18} /> },
      { path: '/ml-studio', name: 'Neural Studio', icon: <Cpu size={18} /> },
    ];
  } else {
    // Patient
    mainItems = [
      { path: '/dashboard', name: 'Patient Overview', icon: <LayoutDashboard size={18} /> },
    ];
    hospitalItems = [
      { path: '/departments', name: 'My Doctors', icon: <UserCheck size={18} /> },
      { path: '/appointments', name: 'Doctor Appointments', icon: <Clock size={18} /> },
      { path: '/departments', name: 'Hospital Departments', icon: <Database size={18} /> },
      { path: '/emergency', name: 'Emergency Request', icon: <Activity size={18} /> },
    ];
    reportItems = [
      { path: '/my-reports', name: 'My Medical Reports', icon: <FileText size={18} /> },
      { path: '/own-report', name: 'I Have My Own Report', icon: <FileText size={18} /> },
      { path: '/history', name: 'Report History', icon: <Clock size={18} /> },
    ];
    aiItems = [
      { path: '/own-report', name: 'AI Pre-Analysis', icon: <Brain size={18} /> },
      { path: '/ai-models', name: 'Available AI Models', icon: <Layers size={18} /> },
      { path: '/own-report', name: 'AI Health Assistant', icon: <Bot size={18} /> },
      { path: '/history', name: 'Health Analytics', icon: <BarChart3 size={18} /> },
    ];
  }

  systemItems = [
    { path: '/history', name: 'Assessment Logs', icon: <Clock size={18} /> },
    { path: '/ml-studio', name: 'Neural Studio', icon: <Cpu size={18} /> },
    { path: '/profile', name: 'Profile Settings', icon: <User size={18} /> },
  ];

  const NavSection = ({ title, items }) => (
    <div className="mb-5">
      <h3 className="px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
      <div className="space-y-1">
        {items.map((item, i) => (
          <NavLink
            key={item.name + item.path + i}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 font-bold text-[13px] ${
                isActive 
                  ? 'text-white bg-[#0F9D8A] shadow-lg shadow-teal-600/20' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            {item.icon}
            <span className="tracking-tight">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="flex items-center gap-3 p-6 mb-2">
        <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xl shadow-slate-900/10">
          <ShieldCheck size={22} />
        </div>
        <div className="overflow-hidden">
          <h2 className="text-[15px] font-black text-slate-900 leading-tight uppercase tracking-tight">HEALTH ANALYZER</h2>
          <p className="text-[9px] font-bold text-[#0F9D8A] uppercase tracking-widest leading-tight mt-0.5">Hospital & AI Platform</p>
        </div>
        <button className="md:hidden ml-auto p-2 text-slate-400 hover:bg-slate-50 rounded-lg" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar">
        {user ? (
          <>
            <NavSection title="DASHBOARD" items={mainItems} />
            <NavSection title="HOSPITAL MANAGEMENT" items={hospitalItems} />
            <NavSection title="REPORT MANAGEMENT" items={reportItems} />
            <NavSection title="AI INTELLIGENCE" items={aiItems} />
            <NavSection title="SYSTEM" items={systemItems} />
          </>
        ) : (
          <NavSection title="Public Access" items={[{ path: '/ml-studio', name: 'Neural Studio', icon: <Cpu size={18} /> }]} />
        )}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        {user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                <img src={`https://i.pravatar.cc/100?u=${user.email}`} alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-slate-900 truncate uppercase">{user.full_name || 'Patient'}</p>
                <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-tighter">Verified Session</p>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
              title="Terminate Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <NavLink 
            to="/login" 
            onClick={onClose} 
            className="flex w-full items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-slate-900/20"
          >
            Authenticate Session
          </NavLink>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
