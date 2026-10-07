import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HeartPulse, ArrowUpRight } from 'lucide-react';
import MediNexusLogo from './MediNexusLogo';
import VERSION_CONFIG from '../config/versionConfig';

const Footer = () => {
  return (
    <footer className="bg-[#0A0F1D] text-slate-400 border-t border-slate-800/80 pt-16 pb-12 select-none">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800/80">
          {/* Brand Column (Col 1-4) */}
          <div className="lg:col-span-4 space-y-4">
            <MediNexusLogo size="lg" variant="dark" />
            <p className="text-xs text-teal-400 font-bold tracking-wide uppercase">
              {VERSION_CONFIG.tagline}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Connecting patients, doctors, and clinical workflows through an intelligent hospital platform with doctor-reviewed insights and automated medical report pre-analysis.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Platform Status: Operational (v{VERSION_CONFIG.version})</span>
            </div>
          </div>

          {/* Platform Links (Col 5-6) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Platform</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#platform-overview" className="hover:text-teal-400 transition-colors">Patients</a></li>
              <li><a href="#doctors" className="hover:text-teal-400 transition-colors">Doctors</a></li>
              <li><a href="#departments" className="hover:text-teal-400 transition-colors">Departments</a></li>
              <li><a href="#reports-workflow" className="hover:text-teal-400 transition-colors">Medical Reports</a></li>
              <li><a href="#appointment-workflow" className="hover:text-teal-400 transition-colors">Appointments</a></li>
              <li><a href="#clinical-intelligence" className="hover:text-teal-400 transition-colors">Clinical Intelligence</a></li>
              <li><a href="#healthbot" className="hover:text-teal-400 transition-colors">HealthBot</a></li>
            </ul>
          </div>

          {/* Hospital Links (Col 7-8) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Hospital</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#about" className="hover:text-teal-400 transition-colors">About MediNexus</a></li>
              <li><a href="#departments" className="hover:text-teal-400 transition-colors">Centers of Excellence</a></li>
              <li><a href="#doctors" className="hover:text-teal-400 transition-colors">Medical Staff</a></li>
              <li><a href="#services" className="hover:text-teal-400 transition-colors">Hospital Services</a></li>
              <li><a href="#emergency" className="text-rose-400 hover:text-rose-300 font-semibold transition-colors">Emergency Triage</a></li>
            </ul>
          </div>

          {/* Patient Access (Col 9-10) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Patient Access</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/patient/login" className="hover:text-teal-400 transition-colors flex items-center gap-1">
                  <span>Patient Sign In</span>
                  <ArrowUpRight size={12} className="opacity-60" />
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors flex items-center gap-1">
                  <span>Register Patient</span>
                  <ArrowUpRight size={12} className="opacity-80" />
                </Link>
              </li>
              <li>
                <a href="#appointment-workflow" className="hover:text-teal-400 transition-colors flex items-center gap-1">
                  <span>Book Appointment</span>
                  <ArrowUpRight size={12} className="opacity-60" />
                </a>
              </li>
              <li>
                <a href="#emergency" className="text-rose-400 hover:text-rose-300 font-semibold transition-colors flex items-center gap-1">
                  <span>Emergency Care</span>
                  <ArrowUpRight size={12} className="opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Clinical Trust & Notice (Col 11-12) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Clinical Notice</h3>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 text-teal-400 font-bold mb-1">
                <ShieldCheck size={14} />
                <span>Decision Support</span>
              </div>
              MediNexus AI provides clinical pre-analysis and decision support. Diagnoses are confirmed by licensed physicians.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MediNexus. AI-Powered Hospital Management &amp; Clinical Intelligence System.</p>
          <div className="flex items-center gap-6">
            <span>Secure Patient Portal</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>Doctor-Reviewed Insights</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
