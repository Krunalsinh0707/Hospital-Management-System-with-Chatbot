import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Activity, Heart, FileText, Clock, User, X, LogOut, 
  Cpu, ShieldCheck, Database, Brain, Layers,
  UserCheck, BarChart3, Calendar, Settings, AlertOctagon,
  Building, Zap, Droplets
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'patient';
  const isDoctor = role === 'doctor' || role === 'emergency_doctor';
  const isAdmin = role === 'admin' || role === 'hospital_admin' || role === 'department_admin';

  let sections = [];

  if (isDoctor) {
    sections = [
      {
        title: 'CLINICAL OVERVIEW',
        items: [
          { path: '/doctor/dashboard', name: 'Clinical Overview', icon: <LayoutDashboard size={18} /> },
        ]
      },
      {
        title: 'PATIENT CARE',
        items: [
          { path: '/doctor/appointments', name: 'Consultations & Triage', icon: <Calendar size={18} /> },
          { path: '/doctor/reports', name: 'AI Decision & Review', icon: <ShieldCheck size={18} /> },
          { path: '/emergency', name: 'Emergency Queue', icon: <Activity size={18} /> },
          { path: '/departments', name: 'Hospital Departments', icon: <Building size={18} /> },
        ]
      },
      {
        title: 'AI INTELLIGENCE',
        items: [
          { path: '/ai-models', name: 'Model Registry', icon: <Layers size={18} /> },
          { path: '/ml-studio', name: 'Neural Studio', icon: <Cpu size={18} /> },
        ]
      },
      {
        title: 'ACCOUNT',
        items: [
          { path: '/profile', name: 'Profile', icon: <User size={18} /> },
          { path: '/settings', name: 'Settings', icon: <Settings size={18} /> },
        ]
      }
    ];
  } else if (isAdmin) {
    sections = [
      {
        title: 'ADMINISTRATION',
        items: [
          { path: '/dashboard', name: 'Hospital Overview', icon: <LayoutDashboard size={18} /> },
          { path: '/admin', name: 'System Control', icon: <Database size={18} /> },
        ]
      },
      {
        title: 'HOSPITAL MANAGEMENT',
        items: [
          { path: '/departments', name: 'Departments', icon: <Database size={18} /> },
          { path: '/emergency', name: 'Emergency Queue', icon: <Activity size={18} /> },
          { path: '/my-reports', name: 'Medical Records', icon: <FileText size={18} /> },
        ]
      },
      {
        title: 'AI INTELLIGENCE',
        items: [
          { path: '/ai-models', name: 'AI Model Registry', icon: <Layers size={18} /> },
          { path: '/ml-studio', name: 'Neural Studio', icon: <Cpu size={18} /> },
        ]
      },
      {
        title: 'ACCOUNT',
        items: [
          { path: '/profile', name: 'Profile', icon: <User size={18} /> },
          { path: '/settings', name: 'Settings', icon: <Settings size={18} /> },
        ]
      }
    ];
  } else {
    // Standard Authentic Patient Portal Sidebar (Section 18)
    sections = [
      {
        title: 'PATIENT',
        items: [
          { path: '/dashboard', name: 'Patient Overview', icon: <LayoutDashboard size={18} /> },
          { path: '/analytics', name: 'My Health', icon: <Activity size={18} /> },
          { path: '/reports', name: 'My Medical Reports', icon: <FileText size={18} /> },
          { path: '/report-history', name: 'Report History', icon: <Clock size={18} /> },
        ]
      },
      {
        title: 'CARE',
        items: [
          { path: '/doctors', name: 'My Doctors', icon: <UserCheck size={18} /> },
          { path: '/appointments', name: 'Doctor Appointments', icon: <Calendar size={18} /> },
          { path: '/departments', name: 'Hospital Departments', icon: <Building size={18} /> },
          { path: '/emergency', name: 'Emergency Assistance', icon: <AlertOctagon size={18} /> },
        ]
      },
      {
        title: 'AI INTELLIGENCE',
        items: [
          { path: '/analytics', name: 'Health Analytics', icon: <BarChart3 size={18} /> },
          { path: '/diabetes', name: 'Diabetes Analysis', icon: <Activity size={18} /> },
          { path: '/heart', name: 'Cardiac Risk', icon: <Heart size={18} /> },
          { path: '/hypertension', name: 'Hypertension', icon: <Zap size={18} /> },
          { path: '/cbc', name: 'CBC Analysis', icon: <Droplets size={18} /> },
        ]
      },
      {
        title: 'ACCOUNT',
        items: [
          { path: '/profile', name: 'Profile', icon: <User size={18} /> },
          { path: '/settings', name: 'Settings', icon: <Settings size={18} /> },
        ]
      }
    ];
  }

  const NavSection = ({ title, items }) => (
    <div className="mb-4">
      <h3 className="px-4 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
      <div className="space-y-0.5">
        {items.map((item, i) => (
          <NavLink
            key={item.name + item.path + i}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium text-[13px] ${
                isActive 
                  ? 'text-white bg-[#0F9D8A] font-semibold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Hospital Platform Branding Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 mb-2">
        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div className="overflow-hidden">
          <h2 className="text-sm font-bold text-slate-900 leading-tight uppercase tracking-tight">HEALTH ANALYZER</h2>
          <p className="text-[9px] font-bold text-[#0F9D8A] uppercase tracking-wider leading-tight mt-0.5">Hospital & AI Platform</p>
        </div>
        <button className="md:hidden ml-auto p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar">
        {user ? (
          sections.map((sec, idx) => (
            <NavSection key={sec.title + idx} title={sec.title} items={sec.items} />
          ))
        ) : (
          <NavSection 
            title="PUBLIC ACCESS" 
            items={[{ path: '/ml-studio', name: 'Neural Studio', icon: <Cpu size={18} /> }]} 
          />
        )}
      </nav>

      {/* Patient Account & Sign Out Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
        {user ? (
          <div className="flex items-center justify-between gap-3">
            <Link to="/profile" onClick={onClose} className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.full_name || 'Patient'}</p>
                <p className="text-[10px] text-slate-400 truncate capitalize">{user.role || 'Patient'}</p>
              </div>
            </Link>
            <button 
              onClick={logout} 
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <NavLink 
            to="/patient/login" 
            onClick={onClose} 
            className="flex w-full items-center justify-center gap-2 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs transition-colors"
          >
            Sign In
          </NavLink>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
