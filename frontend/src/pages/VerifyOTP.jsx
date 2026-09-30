import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Mail, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Clock, Activity } from 'lucide-react';
import passwordResetService from '../services/passwordResetService';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const portal = location.state?.portal || new URLSearchParams(location.search).get('portal') || 'patient';
  const backLoginUrl = portal === 'doctor' ? '/doctor/login' : portal === 'admin' ? '/admin/login' : '/patient/login';
  const portalLabel = portal === 'doctor' ? 'Doctor Portal' : portal === 'admin' ? 'Admin Portal' : 'Patient Portal';

  const emailFromState = location.state?.email || sessionStorage.getItem('health_reset_email') || '';

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // 5-minute countdown timer (300 seconds)
  const [timer, setTimer] = useState(300);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      setMessage({ text: 'No email found. Please request a password reset first.', type: 'error' });
    }
  }, [email]);

  // 5-minute countdown interval
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle single digit input
  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto move cursor to next input box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Backspace support
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Paste support
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedText)) return;

    const digits = pastedText.split('');
    setOtp(digits);
    inputRefs.current[5]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setMessage({ text: 'Please enter a complete 6-digit OTP code.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await passwordResetService.verifyOTP(email, otpCode);

      if (res.success) {
        setMessage({ text: 'OTP Verified! Redirecting to password reset...', type: 'success' });
        
        sessionStorage.setItem('health_reset_otp', otpCode);

        setTimeout(() => {
          navigate(`/reset-password?portal=${portal}`, {
            state: { email, otp: otpCode, portal }
          });
        }, 1200);
      } else {
        setMessage({ text: res.message || 'Invalid or Expired OTP', type: 'error' });
      }
    } catch (err) {
      const rawErr = err.response?.data?.message || err.response?.data?.detail || 'Verification failed.';
      const errMsg = typeof rawErr === 'string' ? rawErr : (Array.isArray(rawErr) ? rawErr.map(e => e.msg).join(', ') : 'Verification failed.');
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !email) return;

    setResendLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await passwordResetService.forgotPassword(email);
      if (res.success) {
        setMessage({ text: 'A new OTP has been sent to your email.', type: 'success' });
        setTimer(300); // Reset 5 min countdown
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setMessage({ text: res.message || 'Failed to resend OTP.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error resending OTP code.', type: 'error' });
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_15%_50%,rgba(15,157,138,0.06)_0%,transparent_50%),radial-gradient(circle_at_85%_30%,rgba(14,165,233,0.06)_0%,transparent_50%)]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center mx-auto mb-4 text-[#0F9D8A]">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Verify OTP Code</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">MediNexus Security Check</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          
          <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[#0F9D8A] text-[10px] font-black uppercase tracking-wider mb-1">
              <Mail size={14} /> Verification OTP Sent To
            </div>
            <p className="text-xs font-bold text-slate-800 break-all">{email || 'Not Provided'}</p>
          </div>

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

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center mb-3">
                Enter 6-Digit Numeric OTP
              </label>
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-14 text-center text-xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-[#0F9D8A] focus:bg-white transition-all shadow-inner"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-slate-600">
                <Clock size={15} className="text-[#0F9D8A]" />
                OTP Validity:
              </div>
              <span className={`font-mono font-black text-sm ${timer < 60 ? 'text-rose-500 animate-pulse' : 'text-[#0F9D8A]'}`}>
                {timer > 0 ? formatTime(timer) : '00:00 (Expired)'}
              </span>
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.join('').length !== 6 || timer <= 0}
              className="w-full py-3.5 px-4 bg-[#0F9D8A] hover:bg-[#0d8272] text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Verify OTP</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0 || resendLoading}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0F9D8A] hover:text-[#0d8272] disabled:text-slate-300 transition-colors uppercase tracking-wider"
            >
              <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
              {timer > 0 ? `Resend OTP in ${formatTime(timer)}` : 'Resend OTP'}
            </button>

            <Link to={backLoginUrl} className="inline-flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest mt-1">
              <ArrowLeft size={12} /> Back to {portalLabel}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
