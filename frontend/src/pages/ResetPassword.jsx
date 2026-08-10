import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, KeyRound, Check, X, Activity } from 'lucide-react';
import passwordResetService from '../services/passwordResetService';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || sessionStorage.getItem('health_reset_email') || '';
  const otpFromState = location.state?.otp || sessionStorage.getItem('health_reset_otp') || '';

  const [email, setEmail] = useState(emailFromState);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Calculate real-time password strength
  const calculateStrength = (pwd) => {
    if (!pwd) return { label: '', score: 0, color: 'bg-slate-200' };

    const hasMinLen = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

    const score = [hasMinLen, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (score <= 2) return { label: 'Weak', score: 33, color: 'bg-rose-500', textColor: 'text-rose-600' };
    if (score <= 4) return { label: 'Medium', score: 66, color: 'bg-amber-500', textColor: 'text-amber-600' };
    return { label: 'Strong', score: 100, color: 'bg-teal-500', textColor: 'text-[#0F9D8A]' };
  };

  const strength = calculateStrength(password);

  const criteria = [
    { label: 'Minimum 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'Numeric digit (0-9)', met: /[0-9]/.test(password) },
    { label: 'Special character (!@#...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage({ text: 'Missing registered email address.', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    if (strength.label !== 'Strong' && strength.score < 66) {
      setMessage({ text: 'Password must meet all security rules.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await passwordResetService.resetPassword(email, password, confirmPassword);

      if (res.success) {
        setMessage({ text: 'Password Updated Successfully', type: 'success' });

        // Clean session storage
        sessionStorage.removeItem('health_reset_email');
        sessionStorage.removeItem('health_reset_otp');

        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Password Updated Successfully. Please login.' }
          });
        }, 1500);
      } else {
        setMessage({ text: res.message || 'Failed to update password.', type: 'error' });
      }
    } catch (err) {
      const rawErr = err.response?.data?.message || err.response?.data?.detail || 'Failed to reset password.';
      const errMsg = typeof rawErr === 'string' ? rawErr : (Array.isArray(rawErr) ? rawErr.map(e => e.msg).join(', ') : 'Password reset failed.');
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_15%_50%,rgba(15,157,138,0.06)_0%,transparent_50%),radial-gradient(circle_at_85%_30%,rgba(14,165,233,0.06)_0%,transparent_50%)]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center mx-auto mb-4 text-[#0F9D8A]">
            <KeyRound size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Reset Password</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Health Analyzer Account Security</p>
        </div>

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
            {!emailFromState && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A]"
                  placeholder="user@gmail.com"
                />
              </div>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-12 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A]"
                  placeholder="Enter new password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Password Strength:</span>
                  <span className={`font-black ${strength.textColor}`}>{strength.label}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/60">
                  {criteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                      {c.met ? (
                        <Check size={14} className="text-[#0F9D8A] font-bold" />
                      ) : (
                        <X size={14} className="text-slate-400" />
                      )}
                      <span className={c.met ? 'text-slate-800 font-bold' : 'text-slate-400'}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors" size={18} />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  required 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-12 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A]"
                  placeholder="Re-enter new password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0F9D8A] hover:bg-[#0d8272] text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider">
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
