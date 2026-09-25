import React, { useState } from 'react';
import { 
  Bell, Shield, CheckCircle2, 
  Save, KeyRound, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();

  // Settings state with realistic defaults
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsReminders, setSmsReminders] = useState(true);
  const [abnormalAlerts, setAbnormalAlerts] = useState(true);
  const [hospitalSharing, setHospitalSharing] = useState(true);
  const [researchConsent, setResearchConsent] = useState(false);
  const [glucoseUnit, setGlucoseUnit] = useState('mg/dL');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F6F9FB] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F9D8A] bg-teal-50 px-2.5 py-0.5 rounded">
                Patient Account
              </span>
              <span className="text-xs text-slate-400 font-medium">• Portal Configurations</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Portal Settings & Clinical Preferences</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage clinical notifications, unit conventions, and medical record privacy preferences.
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Preferences Saved</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Clinical Notifications */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bell size={18} className="text-[#0F9D8A]" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                  Clinical Notifications
                </h2>
                <p className="text-xs text-slate-500">Choose how and when hospital updates are communicated.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 space-y-1">
              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Diagnostic Report Readiness Alerts</span>
                  <span className="text-[11px] text-slate-400">Receive an email notification as soon as a laboratory panel is verified.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0F9D8A] focus:ring-[#0F9D8A] border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">SMS Appointment Reminders</span>
                  <span className="text-[11px] text-slate-400">Receive SMS notifications 24 hours and 2 hours prior to scheduled consultations.</span>
                </div>
                <input
                  type="checkbox"
                  checked={smsReminders}
                  onChange={(e) => setSmsReminders(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0F9D8A] focus:ring-[#0F9D8A] border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Abnormal AI Pre-Analysis Flags</span>
                  <span className="text-[11px] text-slate-400">Immediate high-priority alert when a parameter falls outside clinical standard limits.</span>
                </div>
                <input
                  type="checkbox"
                  checked={abnormalAlerts}
                  onChange={(e) => setAbnormalAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0F9D8A] focus:ring-[#0F9D8A] border-slate-300"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Clinical Units & Conventions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe size={18} className="text-[#0F9D8A]" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                  Clinical Units & Measurement Conventions
                </h2>
                <p className="text-xs text-slate-500">Standard units used for telemetry charts and diagnostic panels.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Blood Glucose Convention</label>
                <select
                  value={glucoseUnit}
                  onChange={(e) => setGlucoseUnit(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0F9D8A]"
                >
                  <option value="mg/dL">mg/dL (Standard Indian/US Convention)</option>
                  <option value="mmol/L">mmol/L (International Convention)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Weight / Mass Convention</label>
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0F9D8A]"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lbs">Pounds (lbs)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Privacy & Hospital Data Sharing */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield size={18} className="text-[#0F9D8A]" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                  Medical Record Privacy & Clinician Access
                </h2>
                <p className="text-xs text-slate-500">Control permissions for electronic health record access.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 space-y-1">
              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Attending Physician EHR Access</span>
                  <span className="text-[11px] text-slate-400">Authorize duty doctors to access prior laboratory reports and AI pre-analyses during consultation.</span>
                </div>
                <input
                  type="checkbox"
                  checked={hospitalSharing}
                  onChange={(e) => setHospitalSharing(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0F9D8A] focus:ring-[#0F9D8A] border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">De-Identified Clinical Research</span>
                  <span className="text-[11px] text-slate-400">Contribute anonymized parameters to improve hospital machine-learning risk models.</span>
                </div>
                <input
                  type="checkbox"
                  checked={researchConsent}
                  onChange={(e) => setResearchConsent(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0F9D8A] focus:ring-[#0F9D8A] border-slate-300"
                />
              </label>
            </div>
          </div>

          {/* Section 4: Authentication & Security */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound size={18} className="text-[#0F9D8A]" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                  Account Security
                </h2>
                <p className="text-xs text-slate-500">Manage credentials and authentication parameters.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Portal Password</span>
                <span className="text-slate-400">Password reset OTP verification via registered mobile number.</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors shrink-0"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0F9D8A] hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Save size={14} />
              <span>Save Portal Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
