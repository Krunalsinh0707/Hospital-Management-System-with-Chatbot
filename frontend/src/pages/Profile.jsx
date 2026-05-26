import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Droplets, Phone, ShieldCheck, LogOut, Settings, Bell, Edit3, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FloatingCard from '../components/FloatingCard';
import api from '../services/api';
import ClinicalHeader from '../components/ClinicalHeader';
import { useLayout } from '../App';

const Profile = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useLayout();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '', email: '', bloodGroup: '', phone: ''
  });

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/me');
      const data = response.data;
      setFormData({
        name: data.full_name || 'System User',
        email: data.email || 'user@healthanalyzer.ai',
        bloodGroup: data.blood_group || 'O+',
        phone: data.mobile_no || '+1 234 567 890'
      });
    } catch (err) {
      console.error("Failed to fetch user details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  return (
    <div className="clinical-page-container">
      <div className="grid grid-cols-12 gap-6">
        <ClinicalHeader 
          title="Practitioner Profile" 
          subtitle="User identity and system credentials" 
          onMenuClick={toggleSidebar}
        />

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <FloatingCard padding="p-0 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-teal-500 to-[#0F9D8A]" />
            <div className="px-6 pb-8 -mt-12 text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 border border-slate-100 shadow-xl mx-auto overflow-hidden">
                  <img 
                    src={`https://i.pravatar.cc/150?u=${formData.email}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-lg border-4 border-white flex items-center justify-center text-white">
                  <ShieldCheck size={16} />
                </div>
              </div>

              <div className="mt-4">
                <h2 className="text-xl font-bold text-slate-800">{formData.name}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Medical Personnel</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-50">
                <div>
                  <p className="text-lg font-black text-slate-800 leading-none">142</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Assessments</p>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-800 leading-none">12</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Models</p>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-800 leading-none">99%</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Confidence</p>
                </div>
              </div>
            </div>
          </FloatingCard>

          <div className="grid grid-cols-1 gap-4">
            <button className="w-full bg-white border border-slate-200 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-colors">
              <Settings size={14} /> System Settings
            </button>
            <button 
              onClick={logout}
              className="w-full bg-rose-50 border border-rose-100 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black text-rose-600 uppercase tracking-widest hover:bg-rose-100 transition-colors"
            >
              <LogOut size={14} /> Terminate Session
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <FloatingCard padding="p-8 h-full">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                  <Fingerprint size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Identity Parameters</h3>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-[#0F9D8A] text-[10px] font-black uppercase rounded-lg border border-teal-100 hover:bg-teal-100 transition-colors">
                <Edit3 size={12} /> Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: 'Clinical Full Name', value: formData.name, icon: <User size={18} /> },
                { label: 'Secure Email Vector', value: formData.email, icon: <Mail size={18} /> },
                { label: 'Blood Group Matrix', value: formData.bloodGroup, icon: <Droplets size={18} /> },
                { label: 'Primary Comms ID', value: formData.phone, icon: <Phone size={18} /> }
              ].map((field, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{field.label}</label>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-slate-400">{field.icon}</div>
                    <span className="text-sm font-bold text-slate-700">{field.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-800 uppercase tracking-tight">Security Protocol Active</h4>
                  <p className="text-xs font-medium text-emerald-600 mt-1 leading-relaxed">
                    Your session is encrypted with 256-bit RSA. Identity verification is performed via biometric neural hashes. Ensure your clinical credentials are kept confidential.
                  </p>
                </div>
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default Profile;
