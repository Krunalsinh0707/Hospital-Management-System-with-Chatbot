import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, Send, CheckCircle2, ShieldPlus, Activity } from 'lucide-react';
import passwordResetService from '../services/passwordResetService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portal = searchParams.get('portal') || 'patient';
  const backLoginUrl = portal === 'doctor' ? '/doctor/login' : portal === 'admin' ? '/admin/login' : '/patient/login';
  const portalLabel = portal === 'doctor' ? 'Doctor Portal' : portal === 'admin' ? 'Admin Portal' : 'Patient Portal';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await passwordResetService.forgotPassword(email);

      if (res.success) {
        setMessage({ text: res.message || 'OTP Sent Successfully! Redirecting...', type: 'success' });
        
        sessionStorage.setItem('health_reset_email', email.trim());

        setTimeout(() => {
          navigate(`/verify-otp?portal=${portal}`, {
            state: { email: email.trim(), portal }
          });
        }, 1200);
      } else {
        setMessage({ text: res.message || 'Email is not registered.', type: 'error' });
      }
    } catch (err) {
      const rawErr = err.response?.data?.message || err.response?.data?.detail || 'Failed to request OTP. Please try again.';
      const errMsg = typeof rawErr === 'string' ? rawErr : (Array.isArray(rawErr) ? rawErr.map(e => e.msg).join(', ') : 'Request failed.');
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_15%_50%,rgba(15,157,138,0.06)_0%,transparent_50%),radial-gradient(circle_at_85%_30%,rgba(14,165,233,0.06)_0%,transparent_50%)]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center mx-auto mb-4 text-[#0F9D8A]">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Forgot Password</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">MediNexus Credentials Recovery</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl text-xs font-bold mb-6 flex items-start gap-2.5 ${
                  message.type === 'success'
                    ? 'bg-teal-50 border border-teal-200 text-[#0F9D8A]'
                    : 'bg-rose-50 border border-rose-200 text-rose-600'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                )}
                <div>{message.text}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              Enter your registered clinical email address. We will dispatch a 6-digit verification OTP code.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Registered Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                  placeholder="user@gmail.com"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !email}
              className="w-full py-3.5 px-4 bg-[#0F9D8A] hover:bg-[#0d8272] text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Sending OTP...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Reset OTP</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to={backLoginUrl} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider">
              <ArrowLeft size={14} /> Back to {portalLabel}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
