import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from "../context/NotificationContext";
import FloatingCard from '../components/FloatingCard';
import { Mail, Lock, AlertCircle, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import mainLogo from '../assets/logo.png';
import VERSION_CONFIG from '../config/versionConfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        showNotification("Session authenticated.", "success");
        if (email.includes('admin') || email === 'admin') {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError("Invalid clinical credentials.");
        showNotification("Invalid email or password", "error");
      }
    } catch (err) {
      setError('Neural connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side: Hero Image & Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative bg-slate-900"
      >
        <img
          src="/src/assets/login_hero.png"
          alt="Clinical Environment"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0F9D8A]/40 to-transparent pointer-events-none" />

        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center text-white">
                <ShieldCheck size={28} />
              </div>
              <span className="text-xl font-black text-white uppercase tracking-tighter">MediNexus</span>
            </div>

            <h2 className="text-5xl font-black text-white leading-tight mb-6">
              Precision AI for <br />
              <span className="text-[#0F9D8A]">Clinical Decision</span> <br />
              Support.
            </h2>
            <p className="text-slate-300 text-lg max-w-md font-medium leading-relaxed">
              Access the neural diagnostic network and analyze patient data with state-of-the-art machine learning models.
            </p>
          </div>

          <div className="flex gap-8 items-center border-t border-white/10 pt-8">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white">99.8%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uptime Reliability</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white">SRL-3</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Readiness Level</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white">AES-256</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Encryption</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10 lg:hidden">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center mx-auto mb-4 text-[#0F9D8A]">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Clinical Gateway</h1>
          </div>

          <div className="mb-10 hidden lg:block">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Authorize Access</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Please enter your clinical credentials to continue</p>
          </div>

          <div className="bg-white p-8 lg:p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-shake">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Clinical ID / Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0F9D8A] transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                    placeholder="doctor@medinexus.org"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Secure Passcode</label>
                  <Link to="/forgot-password" className="text-[10px] font-black text-[#0F9D8A] uppercase hover:underline tracking-wider">Forgot Password?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0F9D8A] transition-colors" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#0F9D8A] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>Initiate Authorization <ArrowRight size={20} /></>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-50 text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                New Practitioner? <Link to="/register" className="text-[#0F9D8A] hover:underline">Request Network Access</Link>
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">{VERSION_CONFIG.organization} v{VERSION_CONFIG.version}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
