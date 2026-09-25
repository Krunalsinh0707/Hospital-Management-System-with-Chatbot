import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlowButton from '../components/GlowButton';
import Footer from '../components/Footer';
import HealthcareImage from '../components/HealthcareImage';
import DepartmentDetailsModal from '../components/DepartmentDetailsModal';
import {
  Brain, Cpu, FileText, Shield, LayoutDashboard, Globe,
  Activity, Heart, Zap, Lock, Hospital, Users, Calendar,
  AlertOctagon, Droplets, Wind, Dna, Bone, Stethoscope,
  ArrowRight, Star, Upload, CheckCircle, BarChart3, Layers, Clock,
  MessageSquare, ChevronRight, Check, ShieldCheck, UserCheck, Eye,
  FileCheck, Sparkles, AlertCircle, Menu, X, ArrowUpRight, FileSpreadsheet
} from 'lucide-react';

// Healthcare Image Assets
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

import mainLogo from '../assets/logo.png';
import './Landing.css';

const Section = ({ children, className = '', delay = 0, id }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial={{ opacity: 0, y: 35 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDeptModal, setSelectedDeptModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const departmentsList = [
    { name: 'Cardiology', image: cardiologyImg, icon: <Heart className="text-rose-500" size={20} />, status: 'Available', desc: 'Cardiovascular risk, resting blood pressure & ECG pre-analysis.' },
    { name: 'Neurology', image: neurologyImg, icon: <Brain className="text-purple-500" size={20} />, status: 'Doctor Review', desc: 'Cognitive parameters & neurological risk support.' },
    { name: 'Orthopedics', image: orthopedicsImg, icon: <Bone className="text-[#0F9D8A]" size={20} />, status: 'Doctor Review', desc: 'Bone density, joint parameters & structural imaging.' },
    { name: 'Pulmonology', image: pulmonologyImg, icon: <Wind className="text-sky-500" size={20} />, status: 'Doctor Review', desc: 'Respiratory panels, SpO2 & chest radiograph support.' },
    { name: 'Oncology', image: oncologyImg, icon: <Dna className="text-indigo-500" size={20} />, status: 'Doctor Review', desc: 'Biostatistical tumor markers & oncological screening.' },
    { name: 'Endocrinology', image: endocrinologyImg, icon: <Activity className="text-amber-500" size={20} />, status: 'Available', desc: 'Glucose vector, insulin sensitivity & metabolic screening.' },
    { name: 'Hematology', image: hematologyImg, icon: <Droplets className="text-rose-600" size={20} />, status: 'Available', desc: 'Complete Blood Count (CBC), hemoglobin & platelet panels.' },
    { name: 'Gastroenterology', image: gastroenterologyImg, icon: <Stethoscope className="text-emerald-500" size={20} />, status: 'Doctor Review', desc: 'Digestive enzyme panels & hepatic function support.' },
    { name: 'Nephrology', image: nephrologyImg, icon: <Activity className="text-cyan-600" size={20} />, status: 'Coming Soon', desc: 'Renal filtration rates & electrolyte balance tracking.' },
    { name: 'Dermatology', image: dermatologyImg, icon: <Shield className="text-blue-500" size={20} />, status: 'Doctor Review', desc: 'Dermatological lesion categorization & tissue support.' },
    { name: 'Pediatrics', image: pediatricsImg, icon: <Users className="text-teal-500" size={20} />, status: 'Doctor Review', desc: 'Pediatric growth milestones & vital thresholds.' },
    { name: 'Gynecology', image: gynecologyImg, icon: <UserCheck className="text-pink-500" size={20} />, status: 'Doctor Review', desc: 'Reproductive health & maternal wellness records.' },
    { name: 'General Medicine', image: generalMedicineImg, icon: <Hospital className="text-slate-700" size={20} />, status: 'Available', desc: 'Broad clinical vitals & holistic risk assessment.' }
  ];

  return (
    <div className="landing-page bg-[#FAFCFF]">
      {/* ── NAVBAR ── */}
      <nav className="landing-nav glass-panel sticky top-4 z-50">
        <div className="logo cursor-pointer flex items-center gap-3" onClick={() => navigate('/')}>
          <img src={mainLogo} alt="Health Analyzer" className="main-logo-img" />
          <div className="brand-text hidden sm:block">
            <h2 className="text-sm font-black tracking-tight text-slate-900 uppercase">HEALTH ANALYZER</h2>
            <p className="text-xs font-semibold text-[#0F9D8A] leading-tight">Intelligent Healthcare Platform</p>
          </div>
        </div>

        <div className="nav-links hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
          <a href="#hero" className="hover:text-[#0F9D8A] transition-colors">Home</a>
          <a href="#features" className="hover:text-[#0F9D8A] transition-colors">Features</a>
          <a href="#reports" className="hover:text-[#0F9D8A] transition-colors">Medical Reports</a>
          <a href="#ai-intelligence" className="hover:text-[#0F9D8A] transition-colors">AI Intelligence</a>
          <a href="#departments" className="hover:text-[#0F9D8A] transition-colors">Departments</a>
          <a href="#emergency" className="hover:text-[#0F9D8A] transition-colors">Emergency</a>
        </div>

        <div className="nav-actions hidden sm:flex items-center gap-3">
          <GlowButton variant="outline" onClick={() => navigate('/patient/login')}>Sign In</GlowButton>
          <GlowButton onClick={() => navigate('/register')}>Get Started</GlowButton>
        </div>

        <button 
          className="md:hidden p-2 text-slate-700 hover:text-[#0F9D8A]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 md:hidden z-50">
            <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">Home</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">Features</a>
            <a href="#reports" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">Medical Reports</a>
            <a href="#ai-intelligence" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">AI Intelligence</a>
            <a href="#departments" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">Departments</a>
            <a href="#emergency" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">Emergency</a>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button onClick={() => navigate('/patient/login')} className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900">Sign In</button>
              <button onClick={() => navigate('/register')} className="w-full py-2.5 rounded-xl bg-[#0F9D8A] text-white text-xs font-bold">Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── 1. HERO SECTION ── */}
      <section className="hero relative max-w-7xl mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center" id="hero">
        {/* Ambient connecting glow to eliminate dead whitespace */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-teal-100/30 rounded-full blur-3xl pointer-events-none -z-10" 
          aria-hidden="true" 
        />

        <motion.div
          className="hero-content lg:col-span-7 space-y-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-[#0F9D8A] border border-teal-100 text-xs font-bold">
            <ShieldCheck size={16} /> Smart Medical Intelligence Platform
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Intelligent Healthcare<br />
            for a <span className="text-[#0F9D8A] underline decoration-teal-300 underline-offset-8">Better Tomorrow</span>
          </h1>
          
          <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-xl">
            Health Analyzer combines hospital management, digital medical records, intelligent report analysis, AI-powered pre-analysis, and doctor decision support into one connected healthcare platform.
          </p>

          <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200 px-3.5 py-2 rounded-xl">
              <Check size={16} className="text-[#0F9D8A]" />
              <span>Digital Medical Records</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200 px-3.5 py-2 rounded-xl">
              <Check size={16} className="text-[#0F9D8A]" />
              <span>AI-Powered Pre-Analysis</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200 px-3.5 py-2 rounded-xl">
              <Check size={16} className="text-[#0F9D8A]" />
              <span>Doctor Decision Support</span>
            </div>
          </div>

          <div className="hero-actions flex flex-wrap gap-4 pt-2">
            <GlowButton onClick={() => navigate('/register')} className="hero-btn shadow-lg shadow-teal-600/20">
              GET STARTED <ArrowRight size={18} />
            </GlowButton>
            <GlowButton variant="outline" className="hero-btn" onClick={() => navigate('/patient/login')}>
              PATIENT SIGN IN
            </GlowButton>
          </div>
        </motion.div>

        {/* HERO RIGHT: REAL GENERATED MEDICAL PHOTOGRAPH */}
        <motion.div
          className="hero-visual lg:col-span-5 relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <HealthcareImage
            src={doctorPatientImg}
            alt="Doctor Patient Consultation"
            variant="hero"
            aspectRatio="aspect-[4/3]"
            className="w-full"
            loading="eager"
            badgeText="AI HEALTHCARE"
            badgeSubtext="Smart Medical Intelligence"
          />

          {/* Floating Feature Glass Card */}
          <motion.div 
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-6 right-6 left-6 md:left-auto md:right-6 md:w-80 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-between z-20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center font-bold shrink-0">
                <Cpu size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0F9D8A] uppercase tracking-wider">AI DIAGNOSTIC ENGINE</span>
                <p className="text-xs font-bold text-slate-900">Real-Time Clinical Analysis Active</p>
                <p className="text-xs font-medium text-slate-500">Doctor Decision Support ✓</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" aria-hidden="true" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── 2. FEATURE STRIP ── */}
      <section className="section py-8 max-w-7xl mx-auto px-6" id="features">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: <FileText size={24} className="text-[#0F9D8A]" />, title: 'Digital Medical Records', desc: 'Store & manage reports digitally.' },
            { icon: <Cpu size={24} className="text-indigo-600" />, title: 'AI Pre-Analysis', desc: 'Pre-screen reports before doctor review.' },
            { icon: <Calendar size={24} className="text-purple-600" />, title: 'Appointments', desc: 'Book consultations with specialists.' },
            { icon: <MessageSquare size={24} className="text-emerald-600" />, title: 'Doctor Communication', desc: 'Direct patient-physician messaging.' },
            { icon: <AlertOctagon size={24} className="text-rose-600" />, title: 'Emergency Care', desc: 'Instant emergency queue triage.' },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#0F9D8A] shadow-sm hover:shadow-md transition-all space-y-2 flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                {card.icon}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">{card.title}</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 3. DIGITAL MEDICAL REPORTS SECTION ── */}
      <Section className="section max-w-7xl mx-auto px-6 py-12" id="reports">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <HealthcareImage
            src={digitalRecordsImg}
            alt="Doctor Reviewing Digital Medical Records"
            variant="section"
            aspectRatio="aspect-[4/3]"
            showOverlay={true}
            overlayTitle="100% Digitized Health History"
            overlaySubtitle="Hospital-generated & uploaded external reports stored securely"
          />

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-[#0F9D8A] text-xs font-bold uppercase tracking-wider">
              <FileCheck size={16} /> DIGITAL REPORT ARCHITECTURE
            </div>
            
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Your Medical Reports.<br />
              <span className="text-[#0F9D8A]">Digitally Organized.</span>
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              Hospital-generated reports and existing reports from other hospitals can be stored, processed, and managed digitally in one unified record portal.
            </p>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Automated Medical Record Pipeline</span>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-800">
                <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#0F9D8A]">Hospital Report / Existing Report</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="px-2.5 py-1 rounded-lg bg-slate-100">OCR & Extraction</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="px-2.5 py-1 rounded-lg bg-slate-100">Validation</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="px-2.5 py-1 rounded-lg bg-slate-100">AI Pre-Analysis</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="px-2.5 py-1 rounded-lg bg-[#0F9D8A] text-white">Doctor Review</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/my-reports')}
              className="px-6 py-3.5 bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <span>Explore Medical Reports</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </Section>

      {/* ── 4. "I HAVE MY OWN REPORT" DEDICATED SECTION ── */}
      <Section className="section max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl space-y-8">
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-left max-w-2xl space-y-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-500/30 inline-block">
              Patient Workflow Entry Point
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Already Have a Medical Report?</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Upload a report from another hospital or laboratory, or manually enter the relevant medical parameters for instant AI pre-analysis and doctor review.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl relative z-10">
            {/* Upload Card */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:border-teal-400 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                  <Upload size={24} />
                </div>
                <h3 className="text-lg font-black text-white">Upload Report</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Support for PDF, JPG, JPEG, PNG formats. Automated OCR extracts available medical parameters automatically.
                </p>
              </div>
              <button
                onClick={() => navigate('/own-report')}
                className="w-full py-3.5 bg-[#0F9D8A] hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Upload Report</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Manual Entry Card */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:border-teal-400 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                  <FileSpreadsheet size={24} />
                </div>
                <h3 className="text-lg font-black text-white">Enter Manually</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Select your medical department and enter only the relevant medical parameters required for screening.
                </p>
              </div>
              <button
                onClick={() => navigate('/own-report')}
                className="w-full py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Enter Information Manually</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 5. AI INTELLIGENCE SECTION ── */}
      <Section className="section max-w-7xl mx-auto px-6 py-12" id="ai-intelligence">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-[#0F9D8A] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={16} /> EXTENDABLE HEALTHCARE ECOSYSTEM
            </div>
            
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              AI INTELLIGENCE<br />
              <span className="text-[#0F9D8A]">Expandable Medical Intelligence</span>
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              Health Analyzer is designed around an extensible medical AI architecture that grows across multiple medical specialties, clinical risk indicators, and doctor decision-support models.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-900">Multi-Model Framework</span>
                <p className="text-xs text-slate-600">Dynamic model loading & department routing</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-900">Doctor Decision Support</span>
                <p className="text-xs text-slate-600">Risk probabilities paired with doctor reviews</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/ai-models')}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md inline-flex items-center gap-2"
            >
              <span>Explore AI Model Registry</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <HealthcareImage
            src={aiHealthcareImg}
            alt="Advanced AI Healthcare Intelligence Visualization"
            variant="section"
            aspectRatio="aspect-[4/3]"
            showOverlay={true}
            overlayTitle="AI Medical Intelligence"
            overlaySubtitle="Extensible pre-analysis & doctor decision support"
          />
        </div>
      </Section>

      {/* ── 6. MEDICAL DEPARTMENTS SECTION ── */}
      <Section className="section max-w-7xl mx-auto px-6 py-12" id="departments">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F9D8A] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            CLINICAL SPECIALTIES
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">OUR MEDICAL DEPARTMENTS</h2>
          <p className="text-sm text-slate-500">
            Connected medical services and specialized AI decision support across departments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentsList.map((dept, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => {
                setSelectedDeptModal(dept);
                setIsModalOpen(true);
              }}
              className="bg-white rounded-2xl border border-slate-200 hover:border-[#0F9D8A] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col justify-between cursor-pointer"
            >
              <HealthcareImage
                src={dept.image}
                alt={dept.name}
                variant="department"
                aspectRatio="aspect-[16/9]"
                badgeText={dept.name}
                badgeSubtext={dept.status}
              />
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      {dept.icon}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0F9D8A] transition-colors">
                      {dept.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{dept.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 group-hover:bg-teal-50 text-slate-700 group-hover:text-[#0F9D8A] text-xs font-bold flex items-center justify-between transition-all duration-200">
                    <span>View Department</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── 7. PATIENT + DOCTOR COMMUNICATION SECTION ── */}
      <Section className="section max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <HealthcareImage
            src={doctorConsultationImg}
            alt="Doctor Patient Consultation"
            variant="section"
            aspectRatio="aspect-[4/3]"
            showOverlay={true}
            overlayTitle="Patient-Doctor Consultation"
            overlaySubtitle="Direct clinical communication & appointment review"
          />

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-[#0F9D8A] text-xs font-bold uppercase tracking-wider">
              <Users size={16} /> PATIENT-DOCTOR CARE
            </div>
            
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              BETTER COMMUNICATION.<br />
              <span className="text-[#0F9D8A]">BETTER CARE.</span>
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              Patients select their department, connect with authorized doctors, book appointments, and maintain ongoing care communication in one secure portal.
            </p>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-800 shadow-sm">
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#0F9D8A]">Patient</span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="px-2.5 py-1 rounded-lg bg-slate-100">Department</span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="px-2.5 py-1 rounded-lg bg-slate-100">Doctor</span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="px-2.5 py-1 rounded-lg bg-slate-100">Appointment</span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="px-2.5 py-1 rounded-lg bg-[#0F9D8A] text-white">Consultation</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 8. EMERGENCY CARE SECTION ── */}
      <Section className="section max-w-7xl mx-auto px-6 py-8" id="emergency">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 md:p-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
                PRIORITY CARE RESPONSE
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-rose-950">
                EMERGENCY SUPPORT WHEN IT MATTERS
              </h2>
              <p className="text-sm text-rose-800 max-w-xl leading-relaxed">
                Send an immediate emergency request that enters the priority triage queue for urgent review by authorized emergency physicians.
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-rose-900 pt-2">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-rose-200">Patient</span>
                <ChevronRight size={14} className="text-rose-400" />
                <span className="px-2.5 py-1 rounded-lg bg-white border border-rose-200">Emergency Request</span>
                <ChevronRight size={14} className="text-rose-400" />
                <span className="px-2.5 py-1 rounded-lg bg-white border border-rose-200">Emergency Queue</span>
                <ChevronRight size={14} className="text-rose-400" />
                <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white">Emergency Doctor</span>
              </div>

              <button
                onClick={() => navigate('/emergency')}
                className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-900/20 flex items-center gap-2"
              >
                <AlertOctagon size={18} />
                <span>Emergency Support Request</span>
              </button>
            </div>

            <HealthcareImage
              src={emergencyCareImg}
              alt="Hospital Emergency Care Unit"
              variant="section"
              aspectRatio="aspect-[16/10]"
              badgeText="Priority Care Unit"
              badgeSubtext="Emergency Queue"
            />
          </div>
        </div>
      </Section>

      {/* ── 9. PATIENT ANALYTICS SECTION ── */}
      <Section className="section max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-[#0F9D8A] text-xs font-bold uppercase tracking-wider">
              <BarChart3 size={16} /> PATIENT ANALYTICS
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              PATIENT HEALTH TRENDS & ANALYTICS
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              Track vital historical trends, report history, appointment schedules, and risk assessments with integrated health visualizations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <h3 className="text-xs font-bold text-slate-900">Health Trends</h3>
                <p className="text-xs text-slate-600">Track vitals and physiological parameters</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <h3 className="text-xs font-bold text-slate-900">Report History</h3>
                <p className="text-xs text-slate-600">Complete archive of diagnostic reports</p>
              </div>
            </div>
          </div>

          <HealthcareImage
            src={analyticsImg}
            alt="Healthcare Analytics & Health Trends"
            variant="section"
            aspectRatio="aspect-[4/3]"
            showOverlay={true}
            overlayTitle="Clinical Analytics Dashboard"
            overlaySubtitle="Visualizing physiological parameters over time"
          />
        </div>
      </Section>

      {/* ── 10. AI HEALTH ASSISTANT SECTION ── */}
      <Section className="section max-w-7xl mx-auto px-6 py-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-2xl">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              CLINICAL AI CHATBOT
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold">MEET YOUR AI HEALTH ASSISTANT</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Get help understanding medical terminology, navigating hospital departments, organizing report information, and preparing questions for your physician.
            </p>
            
            <button
              onClick={() => navigate('/patient/login')}
              className="px-6 py-3.5 bg-[#0F9D8A] hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-teal-900/30 flex items-center gap-2"
            >
              <Brain size={18} />
              <span>ASK HEALTH ANALYZER AI</span>
            </button>
          </div>

          <HealthcareImage
            src={aiAssistantImg}
            alt="Patient Consulting AI Health Assistant"
            variant="hero"
            aspectRatio="aspect-[16/10]"
            badgeText="AI Health Assistant"
            badgeSubtext="Interactive Guidance"
          />
        </div>
      </Section>

      {/* Department Details Modal */}
      <DepartmentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        departmentSlug={selectedDeptModal?.name?.toLowerCase().replace(/\s+/g, '-')}
        departmentData={selectedDeptModal}
      />

      {/* ── 11. FOOTER ── */}
      <Footer />
    </div>
  );
};

export default Landing;
