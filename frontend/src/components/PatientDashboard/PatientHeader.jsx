import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Search, Bell, Check, Clock, Calendar, 
  FileText, UserCheck, X, Building
} from 'lucide-react';
import api from '../../services/api';

const PatientHeader = ({ user, onToggleSidebar, onSearchOpen }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef(null);

  // Search overlay state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real notifications
  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/my');
        if (isMounted && res.data) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unread_count || 0);
        }
      } catch (err) {
        // Silent fail for notifications
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close notifications menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'KM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.full_name);

  return (
    <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Platform Branding */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-bold shadow-xs transition-transform group-hover:scale-105 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                MediNexus
              </h1>
              <p className="text-[11px] font-medium text-slate-500 leading-tight">
                Clinical Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Right: Search, Notifications, Patient Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 sm:px-3 sm:py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 text-xs font-medium"
            title="Search clinical portal"
            aria-label="Search"
          >
            <Search size={18} />
            <span className="hidden lg:inline text-slate-400">Search health records...</span>
          </button>

          {/* Notifications Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="w-2.5 h-2.5 bg-[#0D9488] rounded-full absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notification Popover Panel */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E8F5F3] text-[#0D9488] rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Real-time alerts</span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 ${!n.is_read ? 'bg-[#F0FDFA]/50' : ''}`}
                      >
                        <div className="space-y-1">
                          <p className={`text-xs ${!n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {n.created_at}
                          </p>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="p-1 text-slate-400 hover:text-[#0D9488] rounded"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs font-medium">
                      No notifications at this time
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Patient Profile Chip */}
          <Link 
            to="/profile"
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 sm:pr-3 py-1 bg-slate-50/80 hover:bg-slate-100/90 rounded-full border border-slate-200/80 transition-all hover:shadow-xs group"
          >
            <div className="w-8 h-8 rounded-full bg-[#E8F5F3] text-[#0D9488] border border-[#BDE5DF] flex items-center justify-center font-bold text-xs shrink-0 tracking-tight group-hover:scale-105 transition-transform">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user?.full_name || 'Krunalsinh Mori'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium capitalize leading-tight">
                {user?.role || 'Patient'}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Search Modal */}
      {searchOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setSearchOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search appointments, reports, doctors, or departments..."
                className="w-full text-sm outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                autoFocus
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="pt-3 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Quick Navigation</p>
              <button 
                onClick={() => { setSearchOpen(false); navigate('/appointments'); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                <Calendar size={15} className="text-[#0D9488]" />
                <span>My Appointments</span>
              </button>
              <button 
                onClick={() => { setSearchOpen(false); navigate('/reports'); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                <FileText size={15} className="text-[#0D9488]" />
                <span>Medical Reports &amp; Laboratory Tests</span>
              </button>
              <button 
                onClick={() => { setSearchOpen(false); navigate('/doctors'); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                <UserCheck size={15} className="text-[#0D9488]" />
                <span>Find Doctors &amp; Specialists</span>
              </button>
              <button 
                onClick={() => { setSearchOpen(false); navigate('/departments'); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                <Building size={15} className="text-[#0D9488]" />
                <span>Hospital Departments</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default PatientHeader;
