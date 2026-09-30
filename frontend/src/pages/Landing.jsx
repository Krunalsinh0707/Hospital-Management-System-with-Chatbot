import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MediNexusLogo from '../components/MediNexusLogo';
import Footer from '../components/Footer';
import HealthcareImage from '../components/HealthcareImage';
import DepartmentDetailsModal from '../components/DepartmentDetailsModal';
import { getDepartments, getAllDoctors } from '../services/hospitalService';
import VERSION_CONFIG from '../config/versionConfig';
import {
  Brain, Cpu, FileText, Shield, LayoutDashboard, Globe,
  Activity, Heart, Zap, Lock, Hospital, Users, Calendar,
  AlertOctagon, Droplets, Wind, Dna, Bone, Stethoscope,
  ArrowRight, Star, Upload, CheckCircle, BarChart3, Layers, Clock,
  MessageSquare, ChevronRight, Check, ShieldCheck, UserCheck, Eye,
  FileCheck, Sparkles, AlertCircle, Menu, X, ArrowUpRight, FileSpreadsheet,
  ChevronDown, PhoneCall, CheckCircle2, User, HelpCircle
} from 'lucide-react';

// Healthcare Image Assets (All existing verified assets)
import doctorPatientImg from '../assets/healthcare/hero/doctor-patient.jpg';
import aiHealthcareImg from '../assets/healthcare/ai/ai-healthcare.jpg';
import digitalRecordsImg from '../assets/healthcare/reports/digital-records.jpg';
import doctorConsultationImg from '../assets/healthcare/communication/doctor-patient-consultation.jpg';
import emergencyCareImg from '../assets/healthcare/emergency/emergency-care.jpg';
import analyticsImg from '../assets/healthcare/ai/analytics.jpg';
import aiAssistantImg from '../assets/healthcare/ai/ai-assistant.jpg';

// Department Assets
import cardiologyImg from '../assets/healthcare/departments/cardiology.jpg';
import neurologyImg from '../assets/healthcare/departments/neurology.jpg';
import orthopedicsImg from '../assets/healthcare/departments/orthopedics.jpg';
import pulmonologyImg from '../assets/healthcare/departments/pulmonology.jpg';
import oncologyImg from '../assets/healthcare/departments/oncology.jpg';
import endocrinologyImg from '../assets/healthcare/departments/endocrinology.jpg';
import hematologyImg from '../assets/healthcare/departments/hematology.jpg';
import gastroenterologyImg from '../assets/healthcare/departments/gastroenterology.jpg';
import nephrologyImg from '../assets/healthcare/departments/nephrology.jpg';
import dermatologyImg from '../assets/healthcare/departments/dermatology.jpg';
import pediatricsImg from '../assets/healthcare/departments/pediatrics.jpg';
import gynecologyImg from '../assets/healthcare/departments/gynecology.jpg';
import generalMedicineImg from '../assets/healthcare/departments/general-medicine.jpg';

import './Landing.css';

// Reusable animated Section component
const Section = ({ children, className = '', delay = 0, id }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
};

// Department fallback image mapping
const deptImageMap = {
  cardiology: cardiologyImg,
  neurology: neurologyImg,
  orthopedics: orthopedicsImg,
  pulmonology: pulmonologyImg,
  oncology: oncologyImg,
  endocrinology: endocrinologyImg,
  hematology: hematologyImg,
  gastroenterology: gastroenterologyImg,
  nephrology: nephrologyImg,
  dermatology: dermatologyImg,
  pediatrics: pediatricsImg,
  gynecology: gynecologyImg,
  general: generalMedicineImg,
  'general-medicine': generalMedicineImg,
  emergency: emergencyCareImg
};

// Department fallback icon mapping
const deptIconMap = {
  cardiology: <Heart className="text-rose-500" size={20} />,
  neurology: <Brain className="text-purple-500" size={20} />,
  orthopedics: <Bone className="text-[#0F9D8A]" size={20} />,
  pulmonology: <Wind className="text-sky-500" size={20} />,
  oncology: <Dna className="text-indigo-500" size={20} />,
  endocrinology: <Activity className="text-amber-500" size={20} />,
  hematology: <Droplets className="text-rose-600" size={20} />,
  gastroenterology: <Stethoscope className="text-emerald-500" size={20} />,
  nephrology: <Activity className="text-cyan-600" size={20} />,
  dermatology: <Shield className="text-blue-500" size={20} />,
  pediatrics: <Users className="text-teal-500" size={20} />,
  gynecology: <UserCheck className="text-pink-500" size={20} />,
  general: <Hospital className="text-slate-700" size={20} />,
  emergency: <AlertOctagon className="text-rose-600" size={20} />
};

const defaultDepartments = [
  { id: 1, name: 'Cardiology', slug: 'cardiology', status: 'Available', description: 'Cardiovascular risk, resting blood pressure & ECG pre-analysis.' },
  { id: 2, name: 'Neurology', slug: 'neurology', status: 'Doctor Review', description: 'Cognitive parameters & neurological risk support.' },
  { id: 3, name: 'Orthopedics', slug: 'orthopedics', status: 'Doctor Review', description: 'Bone density, joint parameters & structural imaging.' },
  { id: 4, name: 'Pulmonology', slug: 'pulmonology', status: 'Doctor Review', description: 'Respiratory panels, SpO2 & chest radiograph support.' },
  { id: 5, name: 'Oncology', slug: 'oncology', status: 'Doctor Review', description: 'Biostatistical tumor markers & oncological screening.' },
  { id: 6, name: 'Endocrinology', slug: 'endocrinology', status: 'Available', description: 'Glucose vector, insulin sensitivity & metabolic screening.' },
  { id: 7, name: 'Hematology', slug: 'hematology', status: 'Available', description: 'Complete Blood Count (CBC), hemoglobin & platelet panels.' },
  { id: 8, name: 'Gastroenterology', slug: 'gastroenterology', status: 'Doctor Review', description: 'Digestive enzyme panels & hepatic function support.' },
  { id: 9, name: 'Nephrology', slug: 'nephrology', status: 'Coming Soon', description: 'Renal filtration rates & electrolyte balance tracking.' },
  { id: 10, name: 'Dermatology', slug: 'dermatology', status: 'Doctor Review', description: 'Dermatological lesion categorization & tissue support.' },
  { id: 11, name: 'Pediatrics', slug: 'pediatrics', status: 'Doctor Review', description: 'Pediatric growth milestones & vital thresholds.' },
  { id: 12, name: 'Gynecology', slug: 'gynecology', status: 'Doctor Review', description: 'Reproductive health & maternal wellness records.' },
  { id: 13, name: 'General Medicine', slug: 'general', status: 'Available', description: 'Broad clinical vitals & holistic risk assessment.' },
  { id: 14, name: 'Emergency Care', slug: 'emergency', status: 'Available', description: 'Critical care, urgent triage, and emergency medical response.' }
];

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [selectedDeptModal, setSelectedDeptModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dynamic backend data state
  const [departments, setDepartments] = useState(defaultDepartments);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [showAllDepartments, setShowAllDepartments] = useState(false);
  const [activeSection, setActiveSection] = useState('about');

  // Doctor initials helper stripping "Dr." prefix
  const getDoctorInitials = (name) => {
    if (!name) return 'MD';
    const clean = name.replace(/^(Dr\.?|Doctor)\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || 'MD').toUpperCase();
  };

  // Scrollspy for active navigation state
  useEffect(() => {
    const sectionIds = ['about', 'departments', 'doctors', 'services', 'clinical-intelligence', 'emergency'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i]);
          return;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Quick appointment booking widget state
  const [bookingDeptId, setBookingDeptId] = useState('');
  const [bookingDoctorId, setBookingDoctorId] = useState('');
  const [bookingDate, setBookingDate] = useState('');

  // Fetch verified departments and doctors from backend
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const deptsData = await getDepartments();
        if (isMounted && Array.isArray(deptsData) && deptsData.length > 0) {
          setDepartments(deptsData);
        }
      } catch (err) {
        // Graceful fallback to default verified departments
      }

      try {
        setLoadingDoctors(true);
        const docsData = await getAllDoctors();
        if (isMounted && Array.isArray(docsData)) {
          setDoctors(docsData);
        }
      } catch (err) {
        // Doctors empty state handles this gracefully
      } finally {
        if (isMounted) setLoadingDoctors(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  // Filtered doctors based on active tab
  const filteredDoctors = selectedDeptFilter === 'ALL'
    ? doctors
    : doctors.filter(doc => String(doc.department_id) === String(selectedDeptFilter) || doc.department_name?.toLowerCase().includes(selectedDeptFilter.toLowerCase()));

  // Filter doctors available for the quick booking dropdown
  const bookingAvailableDoctors = bookingDeptId
    ? doctors.filter(doc => String(doc.department_id) === String(bookingDeptId))
    : doctors;

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    navigate('/appointments', {
      state: {
        departmentId: bookingDeptId,
        doctorId: bookingDoctorId,
        preferredDate: bookingDate
      }
    });
  };

  return (
    <div className="landing-page bg-[#FAFCFF]">
      {/* ── 1. HEADER / NAVBAR ── */}
      <nav className="landing-nav glass-panel sticky top-3 z-50">
        <div className="flex items-center gap-3">
          <MediNexusLogo 
            size="md" 
            showTagline={false} 
            onClick={() => navigate('/')} 
          />
        </div>

        {/* Desktop Navigation Links with Active Indicator & Single-Line Spacing */}
        <div className="nav-links hidden lg:flex items-center gap-5 xl:gap-6 text-xs font-bold text-slate-600">
          {[
            { id: 'about', label: 'About', href: '#about' },
            { id: 'departments', label: 'Departments', href: '#departments' },
            { id: 'doctors', label: 'Doctors', href: '#doctors' },
            { id: 'services', label: 'Services', href: '#services' },
            { id: 'clinical-intelligence', label: 'Clinical Intelligence', href: '#clinical-intelligence' },
            { id: 'emergency', label: 'Emergency', href: '#emergency', isDanger: true }
          ].map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={activeSection === item.id ? 'page' : undefined}
              className={`transition-all whitespace-nowrap py-1 border-b-2 ${
                activeSection === item.id
                  ? 'text-[#0F9D8A] font-extrabold border-[#0F9D8A]'
                  : item.isDanger
                  ? 'text-rose-600 hover:text-rose-700 border-transparent'
                  : 'text-slate-600 hover:text-[#0F9D8A] border-transparent'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right Action Portals & CTA */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Dropdown for Portals */}
          <div className="relative">
            <button 
              onClick={() => setLoginMenuOpen(!loginMenuOpen)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <span>Portals</span>
              <ChevronDown size={14} className={`transition-transform ${loginMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {loginMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl p-2 shadow-xl border border-slate-100 flex flex-col gap-1 z-50"
                onMouseLeave={() => setLoginMenuOpen(false)}
              >
                <button 
                  onClick={() => { setLoginMenuOpen(false); navigate('/patient/login'); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-[#0F9D8A] transition-colors flex items-center justify-between"
                >
                  <span>Patient Login</span>
                  <User size={14} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => { setLoginMenuOpen(false); navigate('/doctor/login'); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-[#0F9D8A] transition-colors flex items-center justify-between"
                >
                  <span>Doctor Login</span>
                  <Stethoscope size={14} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => { setLoginMenuOpen(false); navigate('/admin/login'); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-[#0F9D8A] transition-colors flex items-center justify-between"
                >
                  <span>Admin Login</span>
                  <Shield size={14} className="text-slate-400" />
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate('/patient/login')}
            className="hidden md:inline-flex px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0F9D8A] hover:bg-slate-100 transition-colors"
          >
            Patient Sign In
          </button>

          <button 
            onClick={() => {
              const el = document.getElementById('appointment-cta');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else navigate('/appointments');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0F9D8A] text-[#0F9D8A] hover:bg-[#0F9D8A] hover:text-white transition-all text-xs font-bold shadow-none"
          >
            <Calendar size={14} />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button 
          className="lg:hidden p-2 text-slate-700 hover:text-[#0F9D8A] rounded-xl hover:bg-slate-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 lg:hidden z-50">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-[#0F9D8A]">About</a>
            <a href="#departments" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-[#0F9D8A]">Departments</a>
            <a href="#doctors" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-[#0F9D8A]">Doctors</a>
            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-[#0F9D8A]">Services</a>
            <a href="#clinical-intelligence" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-[#0F9D8A]">Clinical Intelligence</a>
            <a href="#emergency" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-rose-600">Emergency Support</a>
            
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Portals</span>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => navigate('/patient/login')} className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-teal-50 text-[11px] font-bold text-slate-700">Patient</button>
                <button onClick={() => navigate('/doctor/login')} className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-teal-50 text-[11px] font-bold text-slate-700">Doctor</button>
                <button onClick={() => navigate('/admin/login')} className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-teal-50 text-[11px] font-bold text-slate-700">Admin</button>
              </div>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  const el = document.getElementById('appointment-cta');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigate('/appointments');
                }} 
                className="w-full py-3 rounded-xl bg-[#0F9D8A] text-white text-xs font-bold mt-1 shadow-md shadow-teal-600/20"
              >
                Book Appointment
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── 2. HERO SECTION ── */}
      <section className="hero relative max-w-7xl mx-auto px-6 pt-8 pb-12 lg:pt-14 lg:pb-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center" id="hero">
        {/* Soft Ambient Glow */}
        <div className="ambient-glow-teal top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />

        {/* Hero Left Content */}
        <motion.div
          className="lg:col-span-7 space-y-6"
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Small Pill Badge */}
          <div className="section-badge">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI-POWERED HEALTHCARE PLATFORM</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
            Expert care,<br />
            <span className="text-[#0F9D8A] bg-clip-text">connected by intelligence.</span>
          </h1>
          
          {/* Supporting Text */}
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
            MediNexus connects patients, doctors, and hospital teams through one intelligent healthcare platform — combining hospital management, clinical workflows, medical reports, appointments, and AI-assisted insights.
          </p>

          {/* Trust Indicators - Clean Informational Labels (Issue 14 Fix) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2 py-1">
              <CheckCircle2 size={16} className="text-[#0F9D8A] shrink-0" />
              <span>Secure patient records</span>
            </div>
            <div className="flex items-center gap-2 py-1">
              <CheckCircle2 size={16} className="text-[#0F9D8A] shrink-0" />
              <span>AI-assisted clinical intelligence</span>
            </div>
            <div className="flex items-center gap-2 py-1">
              <CheckCircle2 size={16} className="text-[#0F9D8A] shrink-0" />
              <span>Connected healthcare workflows</span>
            </div>
            <div className="flex items-center gap-2 py-1">
              <CheckCircle2 size={16} className="text-[#0F9D8A] shrink-0" />
              <span>Doctor-reviewed insights</span>
            </div>
          </div>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('appointment-cta');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/appointments');
              }}
              className="btn-pill-primary text-xs sm:text-sm py-3.5 px-7"
            >
              <span>Book an appointment</span>
              <Calendar size={17} />
            </button>
            <a
              href="#about"
              className="btn-pill-outline text-xs sm:text-sm py-3.5 px-6"
            >
              <span>Explore MediNexus</span>
            </a>
          </div>
        </motion.div>

        {/* Hero Right Visual */}
        <motion.div
          className="lg:col-span-5 relative"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <HealthcareImage
            src={doctorPatientImg}
            alt="Doctor Patient Consultation at MediNexus"
            variant="hero"
            aspectRatio="aspect-[4/3]"
            className="w-full"
            loading="eager"
            badgeText="Clinical Consultation"
            badgeSubtext="Doctor Decision Support"
          />

          {/* Floating Clinical Engine Badge */}
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-5 right-4 left-4 sm:left-auto sm:right-4 sm:w-80 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200/80 flex items-center justify-between z-20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center font-bold shrink-0">
                <Cpu size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0F9D8A] block">AI Diagnostic Engine</span>
                <p className="text-xs font-bold text-slate-900 leading-tight">Real-Time Clinical Analysis Active</p>
                <p className="text-xs font-medium text-slate-500">Doctor Decision Support ✓</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" aria-hidden="true" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── 3. QUICK ACCESS SERVICES STRIP ── */}
      <section className="py-6 max-w-7xl mx-auto px-6 w-full" id="quick-services">
        {/* Hidden H2 maintains valid heading hierarchy (Issue 11 Fix) */}
        <h2 className="sr-only">Quick Healthcare Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Calendar size={22} className="text-[#0F9D8A]" />,
              title: 'Book Appointment',
              desc: 'Choose a doctor, department, and convenient appointment time.',
              action: () => {
                const el = document.getElementById('appointment-cta');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/appointments');
              }
            },
            {
              icon: <FileText size={22} className="text-indigo-600" />,
              title: 'Online Medical Reports',
              desc: 'Upload, manage, and securely access medical reports.',
              action: () => navigate('/own-report')
            },
            {
              icon: <MessageSquare size={22} className="text-teal-600" />,
              title: 'Clinical Consultation',
              desc: 'Connect patients with their healthcare team through clinical messaging.',
              action: () => navigate('/patient/login')
            },
            {
              icon: <AlertOctagon size={22} className="text-rose-600" />,
              title: 'Emergency Support',
              desc: 'Access emergency assistance and hospital priority emergency triage.',
              action: () => navigate('/emergency'),
              highlight: true
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              onClick={item.action}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 bg-white ${
                item.highlight ? 'border-rose-200 hover:border-rose-400 shadow-xs hover:shadow-md' : 'border-slate-200 hover:border-[#0F9D8A] shadow-xs hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 tracking-tight">{item.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{item.desc}</p>
              </div>
              <div className="flex items-center text-xs font-bold text-[#0F9D8A] pt-1">
                <span>Access Service</span>
                <ChevronRight size={14} className="ml-1" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 4. PLATFORM STATISTICS & TRUST ── */}
      <Section className="py-10 max-w-7xl mx-auto px-6 w-full" id="metrics">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="space-y-1 pt-3 md:pt-0">
              <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">14</span>
              <p className="text-xs font-bold text-slate-500">Medical Departments</p>
              <p className="text-xs text-slate-400">Specialized clinical centers</p>
            </div>
            <div className="space-y-1 pt-3 md:pt-0">
              <span className="text-3xl lg:text-4xl font-black text-[#0F9D8A] tracking-tight">{doctors.length > 0 ? `${doctors.length}+` : '31+'}</span>
              <p className="text-xs font-bold text-slate-500">Qualified Doctors</p>
              <p className="text-xs text-slate-400">Board-certified specialists</p>
            </div>
            <div className="space-y-1 pt-3 md:pt-0">
              <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">10+</span>
              <p className="text-xs font-bold text-slate-500">Clinical Services</p>
              <p className="text-xs text-slate-400">Integrated diagnostic pipelines</p>
            </div>
            <div className="space-y-1 pt-3 md:pt-0">
              <span className="text-3xl lg:text-4xl font-black text-teal-600 tracking-tight">100%</span>
              <p className="text-xs font-bold text-slate-500">Digitized Records</p>
              <p className="text-xs text-slate-400">Secure role-based access</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 5. WHY MEDINEXUS ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="about">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="section-badge">
            <Sparkles size={14} /> WHY MEDINEXUS
          </div>
          <h2 className="section-title">Healthcare management, connected intelligently.</h2>
          <p className="section-desc">
            MediNexus removes the barrier between patients, doctors, and hospital operations by providing connected workflows and clinical decision support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Brain size={24} className="text-[#0F9D8A]" />,
              title: 'AI-Assisted Clinical Intelligence',
              desc: 'Specialized machine learning models assist with report analysis and surface relevant insights for healthcare workflows.'
            },
            {
              icon: <Users size={24} className="text-indigo-600" />,
              title: 'Connected Patient Care',
              desc: 'Patients can manage appointments, reports, doctors, consultations, and healthcare information from one unified platform.'
            },
            {
              icon: <Lock size={24} className="text-emerald-600" />,
              title: 'Secure Medical Records',
              desc: 'Patient records, lab reports, and consultation histories are handled through authenticated role-based workflows.'
            },
            {
              icon: <ShieldCheck size={24} className="text-amber-600" />,
              title: 'Doctor-Reviewed Information',
              desc: 'AI-generated analysis supports clinical decision-making rather than replacing qualified healthcare professionals.'
            },
            {
              icon: <Activity size={24} className="text-rose-600" />,
              title: 'Smart Hospital Operations',
              desc: 'Seamlessly coordinate patient scheduling, doctor availability, departmental routing, report queues, and administration.'
            },
            {
              icon: <AlertOctagon size={24} className="text-rose-700" />,
              title: 'Rapid Emergency Triage',
              desc: 'Priority emergency queue alerting on-duty physicians for rapid clinical response when urgent care is needed.'
            }
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                {card.icon}
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug">{card.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── 6. MEDINEXUS PLATFORM OVERVIEW (DEEP NAVY CARD CONTAINER) ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="platform-overview">
        <div className="bg-[#0A1124] text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden space-y-10">
          <div className="ambient-glow-teal -top-20 -right-20" aria-hidden="true" />

          {/* Heading */}
          <div className="max-w-2xl space-y-2 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 inline-block">
              COMPLETE HEALTHCARE ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              One platform. Connected healthcare.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Purpose-built interfaces tailored to each stakeholder in the care delivery continuum.
            </p>
          </div>

          {/* 3 Major Role Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            {/* Patients Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-teal-400/40 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                    <User size={22} />
                  </div>
                  <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest bg-teal-500/10 px-2.5 py-0.5 rounded">
                    PATIENTS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">Patient Portal</h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2"><Check size={14} className="text-[#0F9D8A] shrink-0 mt-0.5" /><span>Book &amp; manage appointments</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-[#0F9D8A] shrink-0 mt-0.5" /><span>View doctors &amp; explore departments</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-[#0F9D8A] shrink-0 mt-0.5" /><span>Upload reports &amp; access report history</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-[#0F9D8A] shrink-0 mt-0.5" /><span>Receive AI-assisted pre-analysis insights</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-[#0F9D8A] shrink-0 mt-0.5" /><span>Communicate through clinical consultation</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-[#0F9D8A] shrink-0 mt-0.5" /><span>Interact with HealthBot assistant</span></li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/patient/login')}
                className="w-full py-3 bg-[#0F9D8A] hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Patient Portal</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Doctors Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-teal-400/40 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold">
                    <Stethoscope size={22} />
                  </div>
                  <span className="text-[10px] font-bold text-sky-300 uppercase tracking-widest bg-sky-500/10 px-2.5 py-0.5 rounded">
                    DOCTORS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">Clinical Workstation</h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2"><Check size={14} className="text-sky-400 shrink-0 mt-0.5" /><span>Manage consultations &amp; appointments</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-sky-400 shrink-0 mt-0.5" /><span>Review patient reports &amp; clinical vitals</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-sky-400 shrink-0 mt-0.5" /><span>Inspect AI-assisted pre-analysis outputs</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-sky-400 shrink-0 mt-0.5" /><span>Validate findings &amp; sign off reports</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-sky-400 shrink-0 mt-0.5" /><span>Direct clinical messaging with patients</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-sky-400 shrink-0 mt-0.5" /><span>Handle priority escalation workflows</span></li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/doctor/login')}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border border-slate-700"
              >
                <span>Doctor Workstation</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Admin Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-teal-400/40 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                    <Shield size={22} />
                  </div>
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest bg-purple-500/10 px-2.5 py-0.5 rounded">
                    ADMINISTRATION
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">Hospital Administration</h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2"><Check size={14} className="text-purple-400 shrink-0 mt-0.5" /><span>Manage patient &amp; doctor credentials</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-purple-400 shrink-0 mt-0.5" /><span>Configure hospital departments</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-purple-400 shrink-0 mt-0.5" /><span>Oversee appointment volumes &amp; queues</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-purple-400 shrink-0 mt-0.5" /><span>Audit medical report workflows</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-purple-400 shrink-0 mt-0.5" /><span>Monitor system activity &amp; operational metrics</span></li>
                  <li className="flex items-start gap-2"><Check size={14} className="text-purple-400 shrink-0 mt-0.5" /><span>Manage platform configurations</span></li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/admin/login')}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border border-slate-700"
              >
                <span>Admin Console</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 7. MEDICAL DEPARTMENTS (CENTERS OF EXCELLENCE) ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="departments">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <div className="section-badge">
            <Hospital size={14} /> CENTERS OF EXCELLENCE
          </div>
          <h2 className="section-title">Our Medical Departments</h2>
          <p className="section-desc">
            Connected medical services and specialized AI decision support across departments.
          </p>
        </div>

        {/* Departments Grid with View All Toggle (Issue 18 Fix) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(showAllDepartments ? departments : departments.slice(0, 6)).map((dept, i) => {
            const slug = dept.slug || dept.name?.toLowerCase().replace(/\s+/g, '-').replace('-medicine', '');
            const image = deptImageMap[slug] || generalMedicineImg;
            const icon = deptIconMap[slug] || <Hospital className="text-slate-700" size={20} />;

            return (
              <motion.div
                key={dept.id || i}
                whileHover={{ y: -6 }}
                className="bg-white rounded-3xl border border-slate-200/80 hover:border-[#0F9D8A] shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div 
                  onClick={() => {
                    setSelectedDeptModal(dept);
                    setIsModalOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <HealthcareImage
                    src={image}
                    alt={dept.name}
                    variant="department"
                    aspectRatio="aspect-[16/9]"
                    badgeText={dept.name}
                    badgeSubtext={dept.status || 'Available'}
                  />
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        {icon}
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0F9D8A] transition-colors">
                        {dept.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {dept.description || 'Specialized clinical care & AI decision support.'}
                    </p>
                  </div>

                  {/* Balanced 2-Column Button Row (Issues 19, 20, 26, 28 Fix) */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => {
                        setSelectedDeptModal(dept);
                        setIsModalOpen(true);
                      }}
                      className="btn-card-secondary"
                    >
                      View Details
                    </button>
                    {dept.status === 'Coming Soon' ? (
                      <button
                        disabled
                        aria-disabled="true"
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed text-center"
                      >
                        Coming Soon
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/appointments', { state: { departmentId: dept.id } })}
                        className="btn-card-primary"
                      >
                        <span>Book</span>
                        <Calendar size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All Departments Toggle (Issue 18 Fix) */}
        {departments.length > 6 && (
          <div className="text-center pt-8">
            <button
              onClick={() => setShowAllDepartments(!showAllDepartments)}
              className="btn-pill-outline text-xs inline-flex items-center gap-2"
              aria-expanded={showAllDepartments}
            >
              <span>{showAllDepartments ? 'Show Fewer Departments' : `View All ${departments.length} Departments`}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showAllDepartments ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </Section>

      {/* ── 8. DOCTORS SECTION (MEET THE EXPERTS) ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="doctors">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
          <div className="section-badge">
            <Stethoscope size={14} /> MEET THE EXPERTS
          </div>
          <h2 className="section-title">Doctors You Can Trust</h2>
          <p className="section-desc">
            Board-certified physicians and specialized healthcare practitioners delivering compassionate care backed by clinical intelligence.
          </p>
        </div>

        {/* Department Filter Pills with Matched Borders (Issue 29 Fix) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedDeptFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors border ${
              selectedDeptFilter === 'ALL'
                ? 'bg-[#0F9D8A] text-white border-transparent'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Doctors
          </button>
          {departments.slice(0, 7).map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptFilter(String(dept.id))}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                String(selectedDeptFilter) === String(dept.id)
                  ? 'bg-[#0F9D8A] text-white border-transparent'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        {/* Doctors Grid with Real Backend Doctors */}
        {loadingDoctors ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs animate-pulse space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 mx-auto" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredDoctors.slice(0, 8).map((doc) => (
              <motion.div
                key={doc.id}
                whileHover={{ y: -4 }}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-[#0F9D8A] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3 text-center">
                  {/* Doctor Avatar Badge with Non-Prefixed Initials (Issue 16 Fix) */}
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 text-[#0F9D8A] flex items-center justify-center font-bold text-lg mx-auto shadow-inner">
                    {getDoctorInitials(doc.full_name)}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-snug">{doc.full_name}</h3>
                    <p className="text-xs font-semibold text-[#0F9D8A] mt-0.5">{doc.specialization}</p>
                    {/* Suppress duplicate department name when matching specialty (Issue 15 Fix) */}
                    {doc.department_name && doc.department_name.toLowerCase() !== doc.specialization?.toLowerCase() && (
                      <p className="text-xs text-slate-500 font-medium">{doc.department_name}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-3 text-xs text-slate-500">
                    {doc.qualification && <span>{doc.qualification}</span>}
                    {doc.experience_years > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{doc.experience_years} yrs exp</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Standardized Primary Book Action (Issue 19 Fix) */}
                <button
                  onClick={() => navigate('/appointments', { state: { doctorId: doc.id, departmentId: doc.department_id } })}
                  className="w-full py-2.5 rounded-xl bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Calendar size={13} />
                  <span>Book Consultation</span>
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3 max-w-md mx-auto">
            <Stethoscope size={36} className="text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Physicians Directory</h3>
            <p className="text-xs text-slate-500">
              Doctors are actively assigned through department triage. Browse all departments to request a consultation.
            </p>
            <button 
              onClick={() => setSelectedDeptFilter('ALL')}
              className="px-4 py-2 bg-[#0F9D8A] text-white rounded-xl text-xs font-bold"
            >
              Reset Filter
            </button>
          </div>
        )}

        <div className="text-center pt-8">
          <button
            onClick={() => navigate('/doctors')}
            className="btn-pill-outline text-xs"
          >
            <span>View All Medical Specialists</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </Section>

      {/* ── 9. SERVICES SECTION ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="services">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="section-badge">
            <Activity size={14} /> OUR SERVICES
          </div>
          <h2 className="section-title">Healthcare Services Connected Through MediNexus</h2>
          <p className="section-desc">
            From automated lab intake to emergency triage and specialist consultations, every service is unified on one connected platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <Calendar size={22} className="text-[#0F9D8A]" />, title: 'Appointment Management', desc: 'Real-time appointment scheduling, doctor selection, and digital schedule reminders.' },
            { icon: <FileCheck size={22} className="text-sky-600" />, title: 'Online Medical Reports', desc: 'Secure repository for internal diagnostic records and external lab uploads.' },
            { icon: <Brain size={22} className="text-purple-600" />, title: 'AI Clinical Pre-Analysis', desc: 'Multi-specialty machine learning models that generate risk scores for physician review.' },
            { icon: <MessageSquare size={22} className="text-emerald-600" />, title: 'Clinical Consultation', desc: 'Direct secure clinical chat between patients and authorized attending physicians.' },
            { icon: <Stethoscope size={22} className="text-blue-600" />, title: 'Doctor Communication', desc: 'Structured clinical queries, consultation follow-ups, and prescription review status.' },
            { icon: <Hospital size={22} className="text-slate-700" />, title: 'Department Discovery', desc: 'Comprehensive guide to 14 clinical centers of excellence and specialized services.' },
            { icon: <BarChart3 size={22} className="text-amber-600" />, title: 'Patient Health Records', desc: 'Longitudinal health records, diagnostic archives, and physiological trends.' },
            { icon: <AlertOctagon size={22} className="text-rose-600" />, title: 'Emergency Assistance', desc: 'Urgent priority care triage queue for immediate attention by on-duty emergency physicians.' },
            { icon: <Sparkles size={22} className="text-teal-600" />, title: 'HealthBot AI Assistant', desc: '24/7 intelligent patient assistance for platform navigation and health queries.' },
            { icon: <Shield size={22} className="text-indigo-600" />, title: 'Hospital Administration', desc: 'Complete governance, practitioner credentialing, and clinical queue oversight.' }
          ].map((service, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-[#0F9D8A] shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                {service.icon}
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">{service.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── 10. CLINICAL INTELLIGENCE SECTION (CORE DIFFERENTIATOR) ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="clinical-intelligence">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="section-badge">
              <Sparkles size={14} /> CLINICAL DECISION SUPPORT
            </div>

            <h2 className="section-title">
              Clinical intelligence, designed to support better decisions.
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed">
              MediNexus combines modern healthcare workflows with specialized AI-assisted analysis. By automating parameter extraction and biostatistical risk evaluation, our clinical models assist physicians in prioritizing review queues.
            </p>

            {/* Core Capabilities Checklist */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-[#0F9D8A] shrink-0" />
                <span>Medical Report Analysis</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-[#0F9D8A] shrink-0" />
                <span>AI Risk Assessment</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-[#0F9D8A] shrink-0" />
                <span>Health Trend Analysis</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-[#0F9D8A] shrink-0" />
                <span>OCR &amp; Parameter Extraction</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-[#0F9D8A] shrink-0" />
                <span>Data Range Validation</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-[#0F9D8A] shrink-0" />
                <span>Doctor Review Workflow</span>
              </div>
            </div>

            {/* Clinical Safety Disclaimer */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-[11px] text-slate-600 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck size={16} className="text-[#0F9D8A]" />
                <span>Doctor-Reviewed Decision Support</span>
              </div>
              <p>
                MediNexus AI operates exclusively as decision support. Machine learning pre-analyses do not formulate medical diagnoses independently; all assessments are subject to review by licensed physicians.
              </p>
            </div>

            <button
              onClick={() => navigate('/ai-models')}
              className="btn-pill-primary text-xs"
            >
              <span>Explore Clinical AI Models</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <HealthcareImage
              src={aiHealthcareImg}
              alt="MediNexus Clinical Intelligence and Physician Decision Support"
              variant="section"
              aspectRatio="aspect-[4/3]"
              showOverlay={true}
              overlayTitle="AI Medical Intelligence"
              overlaySubtitle="Extensible pre-analysis & doctor decision support"
            />

            {/* Visual Workflow Steps */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                INTELLIGENT DECISION SUPPORT PIPELINE
              </span>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-800">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100">Patient Data</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="px-2.5 py-1 rounded-lg bg-slate-100">Lab / Report Input</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#0F9D8A]">OCR &amp; Validation</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="px-2.5 py-1 rounded-lg bg-slate-100">AI Pre-Analysis</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="px-2.5 py-1 rounded-lg bg-[#0F9D8A] text-white">Doctor Review</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 11. MEDICAL REPORT WORKFLOW (FROM REPORT TO CLINICAL REVIEW) ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="reports-workflow">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="section-badge">
            <FileText size={14} /> REPORT PIPELINE
          </div>
          <h2 className="section-title">From Report to Clinical Review</h2>
          <p className="section-desc">
            How hospital records and external lab documents move seamlessly through automated extraction to verified doctor review.
          </p>
        </div>

        {/* 6 Step Process Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
          {[
            { step: '01', title: 'Upload Report', desc: 'Submit PDF or scan images, or enter values manually.' },
            { step: '02', title: 'OCR Extraction', desc: 'Automated optical character recognition parses lab values.' },
            { step: '03', title: 'Data Validation', desc: 'Clinical range checks ensure parameters conform to standards.' },
            { step: '04', title: 'AI Pre-Analysis', desc: 'Specialized ML algorithms calculate department risk vectors.' },
            { step: '05', title: 'Doctor Review', desc: 'Licensed physician inspects indicators and signs off findings.' },
            { step: '06', title: 'Clinical Record', desc: 'Securely archived in the patient health history timeline.' }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#0F9D8A] bg-teal-50 px-2 py-0.5 rounded-md">
                  Step {item.step}
                </span>
                {i < 5 && <ChevronRight size={14} className="text-slate-300 hidden lg:block" />}
              </div>
              <h3 className="text-xs font-black text-slate-900 leading-tight">{item.title}</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Action Entry Box */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0A1A2E] to-slate-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 inline-block">
              PATIENT WORKFLOW ENTRY POINT
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Already have a diagnostic report?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Upload existing medical reports or enter lab values manually to initiate automated OCR extraction, pre-analysis, and doctor review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/own-report')}
              className="btn-pill-primary text-xs py-3 px-5"
            >
              <Upload size={15} />
              <span>Upload Report</span>
            </button>
            <button
              onClick={() => navigate('/own-report')}
              className="btn-pill-outline text-xs py-3 px-5 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
            >
              <FileSpreadsheet size={15} />
              <span>Enter Manually</span>
            </button>
          </div>
        </div>
      </Section>

      {/* ── 12. APPOINTMENT WORKFLOW ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="appointment-workflow">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="section-badge">
            <Calendar size={14} /> STREAMLINED CARE
          </div>
          <h2 className="section-title">Book Care in a Few Simple Steps</h2>
          <p className="section-desc">
            Directly connect with specialized physicians and secure consultation slots without long queues or telephone wait times.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'Choose Department', desc: 'Select from 14 specialized hospital departments.' },
            { step: '02', title: 'Choose Doctor', desc: 'Browse credentials, specializations & qualifications.' },
            { step: '03', title: 'Select Available Slot', desc: 'Pick your preferred date and consultation time window.' },
            { step: '04', title: 'Confirm Appointment', desc: 'Review consultation parameters and submit your booking.' },
            { step: '05', title: 'Receive Notification', desc: 'Instant status update and consultation timeline confirmation.' }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F9D8A] font-black text-sm flex items-center justify-center">
                {item.step}
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 leading-snug">{item.title}</h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── 13. HEALTHBOT SECTION ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="healthbot">
        <div className="bg-gradient-to-br from-slate-900 via-[#0C1B2E] to-slate-900 text-white rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center shadow-xl relative overflow-hidden">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 inline-block">
              INTELLIGENT PATIENT ASSISTANT
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Meet HealthBot,<br />
              <span className="text-[#0F9D8A]">your MediNexus healthcare assistant.</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
              HealthBot helps patients navigate the hospital platform, understand healthcare information, check appointment details, look up doctors, and route questions to attending clinicians.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2"><Check size={14} className="text-[#0F9D8A]" /><span>General healthcare guidance</span></div>
              <div className="flex items-center gap-2"><Check size={14} className="text-[#0F9D8A]" /><span>Appointment information</span></div>
              <div className="flex items-center gap-2"><Check size={14} className="text-[#0F9D8A]" /><span>Doctor &amp; department lookup</span></div>
              <div className="flex items-center gap-2"><Check size={14} className="text-[#0F9D8A]" /><span>Medical report status updates</span></div>
              <div className="flex items-center gap-2"><Check size={14} className="text-[#0F9D8A]" /><span>Report submission to doctor</span></div>
              <div className="flex items-center gap-2"><Check size={14} className="text-[#0F9D8A]" /><span>Emergency triage escalation</span></div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/patient/login')}
                className="btn-pill-primary text-xs py-3.5 px-6 shadow-lg shadow-teal-900/30"
              >
                <Brain size={16} />
                <span>Chat with HealthBot</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <HealthcareImage
              src={aiAssistantImg}
              alt="HealthBot AI Healthcare Assistant"
              variant="section"
              aspectRatio="aspect-[4/3]"
              badgeText="HealthBot Assistant"
              badgeSubtext="Active &amp; Ready"
            />
          </div>
        </div>
      </Section>

      {/* ── 14. EMERGENCY SECTION ── */}
      <Section className="py-10 max-w-7xl mx-auto px-6 w-full" id="emergency">
        <div className="bg-rose-50/80 border border-rose-200 rounded-3xl p-8 sm:p-12 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="section-badge-red">
                <AlertOctagon size={14} /> PRIORITY CARE RESPONSE
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                When every minute matters,<br />
                MediNexus helps you reach the right support.
              </h2>
              <p className="text-xs sm:text-sm text-rose-800 leading-relaxed max-w-xl">
                Immediate emergency assistance requests enter the hospital priority triage queue for urgent clinical review by active duty emergency physicians.
              </p>

              {/* Triage Pathway */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-rose-900 pt-2">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-rose-200">Patient Alert</span>
                <ChevronRight size={14} className="text-rose-400" />
                <span className="px-2.5 py-1 rounded-lg bg-white border border-rose-200">Triage Queue</span>
                <ChevronRight size={14} className="text-rose-400" />
                <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white">Emergency Doctor</span>
              </div>

              {/* Strict Medical Safety Disclaimer */}
              <div className="p-3.5 rounded-2xl bg-white border border-rose-200 text-[11px] text-rose-900 leading-relaxed">
                <strong className="block font-bold mb-0.5">Critical Emergency Notice:</strong>
                If you or someone nearby is experiencing a life-threatening medical emergency (such as severe chest pain, stroke symptoms, or severe injury), please immediately call your local emergency service (911/112/108) or go to the nearest emergency department.
              </div>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/emergency')}
                  className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-900/20 flex items-center gap-2"
                >
                  <AlertOctagon size={17} />
                  <span>Access Emergency Care Queue</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <HealthcareImage
                src={emergencyCareImg}
                alt="MediNexus Hospital Emergency Care Unit"
                variant="section"
                aspectRatio="aspect-[16/10]"
                badgeText="Priority Care Unit"
                badgeSubtext="Emergency Queue Active"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ── 15. PATIENT EXPERIENCE & BENEFITS ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="patient-experience">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <HealthcareImage
              src={doctorConsultationImg}
              alt="Patient Care at MediNexus"
              variant="section"
              aspectRatio="aspect-[4/3]"
              showOverlay={true}
              overlayTitle="Your Care, Connected in One Place"
              overlaySubtitle="Appointments, diagnostic reports, and physician communication"
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="section-badge">
              <UserCheck size={14} /> PATIENT EXPERIENCE
            </div>

            <h2 className="section-title">
              Your care, connected in one place.
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed">
              Patients no longer need to navigate fragmented portals or carry physical paper files from desk to desk. MediNexus unifies your healthcare journey under one secure account.
            </p>

            <div className="space-y-3">
              {[
                { title: 'Appointments & Scheduling', desc: 'Real-time schedule management with chosen doctors.' },
                { title: 'Centralized Medical Reports', desc: 'Secure history of internal tests and uploaded external files.' },
                { title: 'Specialist Discovery', desc: 'Explore 14 departments and find the exact care team required.' },
                { title: 'Physician Communication', desc: 'Structured clinical chat directly with attending physicians.' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 16. TRUST & SECURITY SECTION ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="security">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <div className="section-badge">
            <ShieldCheck size={14} /> TRUST &amp; SECURITY
          </div>
          <h2 className="section-title">Built on Trust, Privacy &amp; Clinical Rigor</h2>
          <p className="section-desc">
            Protected workflows engineered for data privacy and role-specific medical integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: <Lock size={22} className="text-[#0F9D8A]" />,
              title: 'SECURE ACCESS',
              desc: 'Authenticated patient, doctor, and admin workflows protected by token verification.'
            },
            {
              icon: <UserCheck size={22} className="text-indigo-600" />,
              title: 'ROLE-BASED ACCESS',
              desc: 'Dedicated permission matrices ensure stakeholders access only permitted clinical records.'
            },
            {
              icon: <FileText size={22} className="text-emerald-600" />,
              title: 'CONTROLLED MEDICAL DATA',
              desc: 'Diagnostic reports and patient vitals are isolated and strictly bounded to authorized teams.'
            },
            {
              icon: <Activity size={22} className="text-purple-600" />,
              title: 'AUDITABLE WORKFLOWS',
              desc: 'All appointment updates, physician sign-offs, and emergency alerts are recorded in clinical logs.'
            }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight leading-snug">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 17. QUICK APPOINTMENT REQUEST WIDGET (INTERACTIVE CTA) ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="appointment-cta">
        <div className="bg-gradient-to-b from-teal-50/60 via-white to-white rounded-3xl p-8 sm:p-12 border-2 border-teal-200/90 shadow-xl space-y-8 relative overflow-hidden">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="section-badge">
              <Calendar size={14} /> BOOK YOUR VISIT TODAY
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Schedule Your Consultation
            </h2>
            <p className="text-xs text-slate-500">
              Select your department, doctor, and preferred date to proceed directly to appointment booking.
            </p>
          </div>

          <form onSubmit={handleBookingSubmit} className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            {/* Department Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Department</label>
              <select
                value={bookingDeptId}
                onChange={(e) => {
                  setBookingDeptId(e.target.value);
                  setBookingDoctorId(''); // Reset doctor when dept changes
                }}
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#0F9D8A]"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Preferred Doctor</label>
              <select
                value={bookingDoctorId}
                onChange={(e) => setBookingDoctorId(e.target.value)}
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#0F9D8A]"
              >
                <option value="">Any Available Specialist</option>
                {bookingAvailableDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.full_name} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Preferred Date</label>
              <input
                type="date"
                value={bookingDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full h-[44px] px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>

            {/* Submit CTA - Exactly Aligned Baseline (Issue 30 Fix) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-transparent select-none hidden lg:block" aria-hidden="true">&nbsp;</label>
              <button
                type="submit"
                className="w-full h-[44px] px-4 bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Book</span>
                <Calendar size={14} />
              </button>
            </div>
          </form>
        </div>
      </Section>

      {/* ── 18. FINAL CALL TO ACTION (MATCHING REFERENCE BOTTOM BANNER) ── */}
      <Section className="py-12 max-w-7xl mx-auto px-6 w-full" id="final-cta">
        <div className="bg-[#0A1124] text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 inline-block">
              INTELLIGENT HOSPITAL PLATFORM
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Healthcare management.<br />
              Clinical intelligence.<br />
              <span className="text-[#0F9D8A]">One connected platform.</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
              MediNexus — AI-Powered Hospital Management &amp; Clinical Intelligence System. Experience connected care for patients, doctors, and hospital administrators.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/register')}
                className="btn-pill-primary text-xs py-3 px-6"
              >
                <span>Get Started</span>
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => navigate('/patient/login')}
                className="btn-pill-outline text-xs py-3 px-6 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
              >
                <span>Patient Portal</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative z-10">
            <HealthcareImage
              src={digitalRecordsImg}
              alt="MediNexus Connected Platform"
              variant="section"
              aspectRatio="aspect-[4/3]"
              badgeText="MediNexus"
              badgeSubtext="Connected Platform"
            />
          </div>
        </div>
      </Section>

      {/* Department Details Modal (Reused existing rich modal) */}
      <DepartmentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        departmentSlug={selectedDeptModal?.slug || selectedDeptModal?.name?.toLowerCase().replace(/\s+/g, '-')}
        departmentData={selectedDeptModal}
      />

      {/* ── 19. FOOTER ── */}
      <Footer />
    </div>
  );
};

export default Landing;
