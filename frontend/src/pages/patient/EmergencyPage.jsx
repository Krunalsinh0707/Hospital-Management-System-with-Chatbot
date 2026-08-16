import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, PhoneCall, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { triggerEmergency } from '../../services/emergencyService';

const EmergencyPage = () => {
  const [severity, setSeverity] = useState('HIGH');
  const [symptoms, setSymptoms] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleTrigger = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await triggerEmergency({
        severity,
        symptoms,
        location,
        contact_phone: phone
      });
      setStatus(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Alert Header */}
      <div className="bg-rose-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0">
            <AlertOctagon size={32} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
              EMERGENCY QUEUE TRIGGER
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1">EMERGENCY MEDICAL REQUEST</h1>
            <p className="text-xs text-rose-100 mt-1">
              Instantly alert duty emergency doctors and hospital triage queue for immediate clinical action.
            </p>
          </div>
        </div>
      </div>

      {status ? (
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-black text-slate-900">EMERGENCY ALERT ACKNOWLEDGED</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {status.message}. An available duty emergency doctor has been notified and will review your case immediately.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl text-xs font-bold text-slate-700">
            Request ID: #{status.emergency_id} | Status: <span className="text-rose-600 uppercase">REQUESTED</span>
          </div>
          <button onClick={() => setStatus(null)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">
            Submit Another Alert
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <form onSubmit={handleTrigger} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Select Severity Level</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-3 rounded-xl text-xs font-black transition-all border ${
                      severity === sev 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Describe Emergency Symptoms</label>
              <textarea
                rows="3"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Severe chest pain, sudden difficulty breathing, loss of consciousness..."
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-rose-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Current Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="ER Room, Ward 4, or Home Address..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Primary phone number..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-900/20"
            >
              {loading ? 'Transmitting Emergency Trigger...' : '🔴 DISPATCH EMERGENCY REQUEST NOW'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmergencyPage;
