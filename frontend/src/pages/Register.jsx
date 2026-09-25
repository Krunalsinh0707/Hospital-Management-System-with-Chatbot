import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingCard from '../components/FloatingCard';
import { Mail, Lock, User, AlertCircle, Phone, Droplets, ShieldPlus, ArrowRight, Eye, EyeOff } from 'lucide-react';
import VERSION_CONFIG from '../config/versionConfig';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await register(fullName, email, mobileNo, bloodGroup, password);
      if (success) {
        navigate('/patient/login', { state: { message: 'Registration successful! Please sign in.' } });
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Neural link timeout.');
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
            <ShieldPlus size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Practitioner Enrollment</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Initialize your clinical credentials</p>
        </div>

        <FloatingCard padding="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                    placeholder="Dr. John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Primary Comms ID</label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors" size={18} />
                  <input
                    type="tel"
                    required
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Blood Group Matrix</label>
                <div className="relative group">
                  <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors" size={18} />
                  <select
                    required
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
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
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                    placeholder="practitioner@hospital.ai"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Secure Passcode</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F9D8A] transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              className="w-full bg-[#0F9D8A] hover:bg-[#0D8A79] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>Request Clinical Access <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Already Registered? <Link to="/patient/login" className="text-[#0F9D8A] hover:underline">Patient Sign In</Link>
            </p>
          </div>
        </FloatingCard>

        <div className="mt-8 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{VERSION_CONFIG.organization} v{VERSION_CONFIG.version}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
