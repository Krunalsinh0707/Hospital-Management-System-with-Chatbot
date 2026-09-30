import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Terminal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import mainLogo from '../../assets/logo.png';

const AdminLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your administrator username or email.');
      return;
    }
    if (!password) {
      setError('Please enter your administrator password.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(cleanId, password, 'admin');
      if (user) {
        showNotification(`Administrator session authenticated: ${user.full_name || 'Admin'}`, 'success');
        navigate('/admin');
      }
    } catch (err) {
      if (err.code === 'WRONG_PORTAL') {
        setError(err.message);
      } else if (err.response && err.response.status === 401) {
        setError('Admin email/username or password is incorrect.');
      } else if (err.response && err.response.status >= 500) {
        setError('System authentication service is currently unavailable.');
      } else if (err.message && err.message.includes('Network Error')) {
        setError('Unable to connect to the administration server.');
      } else {
        setError(err.message || 'Authentication failed. Please verify administrative credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between relative z-10 pt-2">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 text-indigo-400 shadow-md transition-transform group-hover:scale-105">
            <Shield size={22} />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white block leading-tight">MEDINEXUS</span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Administration Gateway</span>
          </div>
        </Link>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
          <Terminal size={12} className="text-indigo-400" />
          <span>SYS_ADMIN</span>
        </div>
      </header>

      {/* Main Admin Console Card */}
      <main className="max-w-md w-full mx-auto my-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-slate-950/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-black/80 border border-slate-800/80 p-8 sm:p-10 text-slate-100"
        >
          {/* Header & Subtitle */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Shield size={14} /> Security Console
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Administration Portal</h1>
            <p className="text-xs font-medium text-slate-400 mt-1">Authorized administrator access for hospital infrastructure</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3 text-rose-300 text-xs font-semibold leading-relaxed"
                role="alert"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
                <div>{error}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Admin Email / Username Field */}
            <div>
              <label htmlFor="admin-identifier" className="block text-xs font-bold text-slate-300 mb-2">
                Admin Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Shield size={18} />
                </div>
                <input
                  id="admin-identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@medinexus.org"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="admin-password" block className="text-xs font-bold text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password?portal=admin"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-3 pl-10 pr-11 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-7 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold">
            <Lock size={13} className="text-indigo-400" />
            <span>Administrative access only. All sessions logged.</span>
          </div>
        </motion.div>

        {/* Secondary Portal Links */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Alternate portals:{' '}
            <Link to="/patient/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors underline decoration-slate-700">
              Patient Login
            </Link>
            <span className="mx-2 text-slate-700">·</span>
            <Link to="/doctor/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors underline decoration-slate-700">
              Doctor Login
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] font-mono text-slate-600 py-3 relative z-10">
        MEDINEXUS CONTROL NODE &middot; STRICT ROLE-BASED ACCESS CONTROL
      </footer>
    </div>
  );
};

export default AdminLogin;
