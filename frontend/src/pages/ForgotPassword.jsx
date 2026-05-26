import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from "../context/NotificationContext";
import FloatingCard from '../components/FloatingCard';
import { Mail, Lock, User, AlertCircle, Phone, Droplets, ShieldCheck, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Verify, 2: Reset
  const [formData, setFormData] = useState({
    email: '',
    mobile_no: '',
    full_name: '',
    blood_group: '',
    otp: '',
    new_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8000/forgot-password', {
        email: formData.email,
        mobile_no: formData.mobile_no,
        full_name: formData.full_name,
        blood_group: formData.blood_group
      });
      
      showNotification(response.data.message, "success");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Identity verification failed.');
      showNotification(err.response?.data?.detail || "Verification failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8000/reset-password', {
        mobile_no: formData.mobile_no,
        otp: formData.otp,
        new_password: formData.new_password
      });
      
      showNotification(response.data.message, "success");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Password reset failed.');
      showNotification(err.response?.data?.detail || "Reset failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-6">
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_15%_50%,rgba(15,157,138,0.05)_0%,transparent_50%),radial-gradient(circle_at_85%_30%,rgba(14,165,233,0.05)_0%,transparent_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center mx-auto mb-4 text-[#0F9D8A]">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Recover Access</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Verify clinical identity to reset passcode</p>
        </div>

        <FloatingCard padding="p-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyIdentity} 
                className="space-y-6"
              >
                {error && (
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Full Legal Name</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors" size={18} />
                      <input 
                        name="full_name"
                        type="text" 
                        required 
                        value={formData.full_name} 
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                        placeholder="As registered"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Registered Mobile</label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors" size={18} />
                      <input 
                        name="mobile_no"
                        type="tel" 
                        required 
                        value={formData.mobile_no} 
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                        placeholder="+91..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Blood Group Matrix</label>
                    <div className="relative group">
                      <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors" size={18} />
                      <select 
                        name="blood_group"
                        required 
                        value={formData.blood_group} 
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select Matrix</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Clinical Email Vector</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors" size={18} />
                      <input 
                        name="email"
                        type="email" 
                        required 
                        value={formData.email} 
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                        placeholder="registered@email.com"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-[#0F9D8A] hover:bg-[#0D8A79] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>Verify Identity <ArrowRight size={18} /></>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleResetPassword} 
                className="space-y-6"
              >
                <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl flex items-start gap-3 mb-4">
                  <CheckCircle2 className="text-[#0F9D8A] mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-bold text-[#0F9D8A]">Identity Verified</h4>
                    <p className="text-[11px] text-teal-700 font-medium">Please enter the 6-digit OTP sent to your mobile and your new passcode.</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">One-Time Passcode (OTP)</label>
                  <input 
                    name="otp"
                    type="text" 
                    required 
                    maxLength={6}
                    value={formData.otp} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-center text-xl font-black tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                    placeholder="000000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">New Secure Passcode</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors" size={18} />
                    <input 
                      name="new_password"
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={formData.new_password} 
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-12 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F9D8A] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>Reset Passcode <ArrowRight size={18} /></>
                  )}
                </button>

                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="w-full text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Back to Identification
                </button>
              </motion.form>
            )}
          </AnimatePresence>
          
          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Remembered your passcode? <Link to="/login" className="text-[#0F9D8A] hover:underline">Authenticate Session</Link>
            </p>
          </div>
        </FloatingCard>

        <div className="mt-8 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Health Analyzer Clinical Network v2.0</p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
