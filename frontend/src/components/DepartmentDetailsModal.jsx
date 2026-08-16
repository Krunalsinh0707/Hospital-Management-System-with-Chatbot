import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X, Heart, Brain, Bone, Wind, Dna, Activity, Droplets,
  Stethoscope, Shield, Users, UserCheck, Hospital, AlertOctagon,
  Calendar, Upload, FileSpreadsheet, Cpu, CheckCircle2, ArrowRight,
  Clock, ShieldCheck, FileText, AlertCircle, RefreshCw, ChevronRight, User
} from 'lucide-react';
import HealthcareImage from './HealthcareImage';
import { getDepartmentDetails } from '../services/hospitalService';

// Department Image Assets
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

const imageMap = {
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
  emergency: cardiologyImg
};

const iconMap = {
  Heart: <Heart className="w-5 h-5 text-rose-500" />,
  Brain: <Brain className="w-5 h-5 text-purple-500" />,
  Bone: <Bone className="w-5 h-5 text-[#0F9D8A]" />,
  Wind: <Wind className="w-5 h-5 text-sky-500" />,
  Dna: <Dna className="w-5 h-5 text-indigo-500" />,
  Activity: <Activity className="w-5 h-5 text-amber-500" />,
  Droplets: <Droplets className="w-5 h-5 text-rose-600" />,
  Stethoscope: <Stethoscope className="w-5 h-5 text-emerald-500" />,
  Shield: <Shield className="w-5 h-5 text-blue-500" />,
  User: <User className="w-5 h-5 text-teal-500" />,
  UserCheck: <UserCheck className="w-5 h-5 text-pink-500" />,
  Hospital: <Hospital className="w-5 h-5 text-slate-700" />,
  AlertOctagon: <AlertOctagon className="w-5 h-5 text-rose-600" />
};

const DepartmentDetailsModal = ({ isOpen, onClose, departmentSlug, departmentData: initialData }) => {
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && (departmentSlug || initialData)) {
      fetchData();
    }
  }, [isOpen, departmentSlug, initialData]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const targetSlug = departmentSlug || initialData?.slug || initialData?.id || 'cardiology';
      const data = await getDepartmentDetails(targetSlug);
      setDetails(data);
    } catch (err) {
      console.error('Failed to load department details:', err);
      if (initialData) {
        // Graceful fallback using initial basic props if backend offline
        setDetails({
          id: initialData.id || 1,
          slug: initialData.slug || departmentSlug || 'cardiology',
          name: initialData.name || 'Medical Department',
          code: initialData.code || 'DEPT',
          icon: initialData.icon || 'Heart',
          specialization: 'Specialized Clinical Care',
          description: initialData.desc || initialData.description || 'Comprehensive clinical monitoring and care.',
          detailed_overview: `${initialData.name || 'This department'} delivers specialized clinical evaluation, diagnostic review, and physician consultations.`,
          status: initialData.status || 'Available',
          services: [
            { name: `${initialData.name || 'Department'} Evaluation`, available: true, description: 'Standard clinical parameter check.' }
          ],
          supported_reports: ['Diagnostic Report', 'Clinical Vitals'],
          supported_analysis: ['Medical parameters', 'Uploaded records'],
          doctors: [],
          ai_models: [],
          workflow: [
            { step: 1, title: 'Medical Report', desc: 'Patient uploads or enters report data.' },
            { step: 2, title: 'OCR & Validation', desc: 'Parameters parsed and verified.' },
            { step: 3, title: 'AI Pre-Analysis', desc: 'Department model runs risk analysis.' },
            { step: 4, title: 'Doctor Review', desc: 'Physician reviews final findings.' }
          ]
        });
      } else {
        setError('Unable to load department information. Please verify network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentSlug = details?.slug || departmentSlug || initialData?.slug || 'cardiology';
  const deptImg = imageMap[currentSlug.toLowerCase()] || cardiologyImg;
  const deptIcon = iconMap[details?.icon] || iconMap[initialData?.icon] || <Heart className="w-5 h-5 text-[#0F9D8A]" />;

  const handleBookAppointment = (docId = null) => {
    onClose();
    navigate('/appointments', {
      state: {
        departmentId: details?.id,
        departmentSlug: currentSlug,
        doctorId: docId
      }
    });
  };

  const handleUploadReport = () => {
    onClose();
    navigate('/own-report', {
      state: {
        departmentSlug: currentSlug,
        departmentName: details?.name,
        mode: 'UPLOAD'
      }
    });
  };

  const handleEnterManually = () => {
    onClose();
    navigate('/own-report', {
      state: {
        departmentSlug: currentSlug,
        departmentName: details?.name,
        mode: 'MANUAL'
      }
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-[#FAFCFF] rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200/80 my-auto"
        >
          {/* Header Bar */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                {deptIcon}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0F9D8A]">
                  HEALTH ANALYZER DEPARTMENT
                </span>
                <h2 className="text-base font-extrabold tracking-tight text-white leading-none mt-0.5">
                  {details?.name || initialData?.name || 'Department Details'}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
            {/* Skeleton Loading State */}
            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-64 bg-slate-200 rounded-3xl w-full" />
                <div className="space-y-3">
                  <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
                  <div className="h-4 bg-slate-200 rounded-lg w-2/3" />
                  <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-28 bg-slate-200 rounded-2xl" />
                  <div className="h-28 bg-slate-200 rounded-2xl" />
                  <div className="h-28 bg-slate-200 rounded-2xl" />
                </div>
              </div>
            ) : error ? (
              /* Error State */
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-base font-black text-slate-900">Unable to load department information</h3>
                <p className="text-xs text-slate-500">{error}</p>
                <button
                  onClick={fetchData}
                  className="px-5 py-2.5 bg-[#0F9D8A] hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Try Again
                </button>
              </div>
            ) : (
              <>
                {/* ── 1. HEADER HERO BANNER ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-7">
                    <HealthcareImage
                      src={deptImg}
                      alt={details?.name}
                      variant="hero"
                      aspectRatio="aspect-[16/10]"
                      badgeText={details?.name}
                      badgeSubtext={details?.status}
                      className="h-full min-h-[240px]"
                    />
                  </div>

                  <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-teal-50 text-[#0F9D8A] border border-teal-100">
                          {details?.code} SPECIALTY
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          details?.status === 'Available'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : details?.status === 'Coming Soon'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {details?.status === 'Available' ? 'AI Analysis Available' : details?.status}
                        </span>
                      </div>

                      <h1 className="text-2xl font-black text-slate-900 tracking-tight">{details?.name}</h1>
                      <p className="text-xs font-bold text-[#0F9D8A]">{details?.specialization}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{details?.description}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <button
                        onClick={() => handleBookAppointment()}
                        className="w-full py-3 bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Calendar size={16} /> Book Department Appointment
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── 2. OVERVIEW ── */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                      {deptIcon}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">DEPARTMENT OVERVIEW</h3>
                      <p className="text-[11px] text-slate-400 font-semibold">Specialized clinical scope & parameters</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {details?.detailed_overview}
                  </p>
                </div>

                {/* ── 3. SERVICES ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Stethoscope size={18} className="text-[#0F9D8A]" /> CLINICAL SERVICES ({details?.services?.length || 0})
                    </h3>
                  </div>

                  {!details?.services || details.services.length === 0 ? (
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
                      Department services will be updated soon.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {details.services.map((srv, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-teal-500 transition-colors">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-900">{srv.name}</h4>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              srv.available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {srv.available ? 'Available' : 'Doctor Referral'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{srv.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── 4. DOCTORS ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Users size={18} className="text-[#0F9D8A]" /> DOCTORS IN THIS DEPARTMENT ({details?.doctors?.length || 0})
                    </h3>
                  </div>

                  {!details?.doctors || details.doctors.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200/80 text-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center mx-auto font-bold">
                        <User size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">No doctors are currently listed for this department.</h4>
                        <p className="text-xs text-slate-500 mt-1">You can submit a department consultation request or book general medicine consultation.</p>
                      </div>
                      <button
                        onClick={() => handleBookAppointment()}
                        className="px-5 py-2.5 bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
                      >
                        [ Request Department Consultation ]
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {details.doctors.map((doc) => (
                        <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#0F9D8A] transition-all">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F9D8A] font-black text-sm flex items-center justify-center border border-teal-100 shrink-0">
                              Dr
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase text-[#0F9D8A] tracking-wider">AVAILABLE TODAY</span>
                              <h4 className="text-sm font-extrabold text-slate-900">{doc.full_name}</h4>
                              <p className="text-[11px] font-bold text-slate-600">{doc.specialization}</p>
                              <p className="text-[10px] text-slate-400">{doc.qualification} • {doc.experience_years} yrs experience</p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-semibold">
                              📅 {doc.availability?.days || 'Mon - Fri'}
                            </span>
                            <button
                              onClick={() => handleBookAppointment(doc.id)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-[#0F9D8A] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                            >
                              Book Appointment <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── 5. AI INTELLIGENCE ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Cpu size={18} className="text-indigo-600" /> AI INTELLIGENCE & CAPABILITIES ({details?.ai_models?.length || 0})
                    </h3>
                  </div>

                  {!details?.ai_models || details.ai_models.length === 0 ? (
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
                      No AI model is currently available for this department. Reports are routed directly for doctor review.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {details.ai_models.map((model) => (
                        <div key={model.slug} className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-widest text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                                AI PRE-ANALYSIS
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                model.status === 'Available' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {model.status}
                              </span>
                            </div>

                            <h4 className="text-sm font-extrabold text-white">{model.name}</h4>
                            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{model.description}</p>
                          </div>

                          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[10px]">
                            <div className="flex justify-between text-slate-400 font-semibold">
                              <span>Version: {model.version}</span>
                              <span>Algorithm: {model.algorithm}</span>
                            </div>
                            <button
                              onClick={handleEnterManually}
                              className="w-full py-2 bg-[#0F9D8A] hover:bg-teal-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span>[ View Model Schema ]</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── 6. MEDICAL REPORTS & SUPPORTED ANALYSIS ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Medical Reports */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <FileText size={16} className="text-[#0F9D8A]" /> SUPPORTED MEDICAL REPORTS
                    </h3>
                    <ul className="space-y-2">
                      {details?.supported_reports?.map((rep, idx) => (
                        <li key={idx} className="text-xs font-bold text-slate-700 flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <CheckCircle2 size={14} className="text-[#0F9D8A] shrink-0" />
                          <span>{rep}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Supported Analysis */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-indigo-600" /> SUPPORTED ANALYSIS PARAMETERS
                    </h3>
                    <ul className="space-y-2">
                      {details?.supported_analysis?.map((ans, idx) => (
                        <li key={idx} className="text-xs font-bold text-slate-700 flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <ChevronRight size={14} className="text-indigo-500 shrink-0" />
                          <span>{ans}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* ── 7. REPORT ANALYSIS WORKFLOW ── */}
                <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0F9D8A]">
                      CLINICAL PIPELINE
                    </span>
                    <h3 className="text-lg font-extrabold text-white tracking-tight mt-0.5">
                      DEPARTMENT REPORT ANALYSIS WORKFLOW
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      AI performs automated pre-analysis to support — not replace — doctor decision-making.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                      { step: '1', title: 'Medical Report', desc: 'PDF / Image / Input' },
                      { step: '2', title: 'OCR & Data', desc: 'Extraction & Validation' },
                      { step: '3', title: 'AI Model', desc: 'Department Pre-Analysis' },
                      { step: '4', title: 'Doctor Review', desc: 'Physician Sign-Off' },
                      { step: '5', title: 'Medical Record', desc: 'Saved to Health Archive' }
                    ].map((st, i) => (
                      <div key={i} className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1 relative">
                        <div className="w-6 h-6 rounded-lg bg-[#0F9D8A] text-white text-[10px] font-black flex items-center justify-center">
                          {st.step}
                        </div>
                        <h4 className="text-xs font-extrabold text-white mt-1">{st.title}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{st.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 8. "I HAVE MY OWN REPORT" & CTAs ── */}
                <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white space-y-6 shadow-xl border border-teal-900/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-teal-300 bg-teal-500/20 px-2.5 py-0.5 rounded border border-teal-500/30">
                        DIRECT PATIENT ACTION
                      </span>
                      <h3 className="text-xl font-extrabold text-white tracking-tight mt-1">
                        HAVE A {details?.name?.toUpperCase()} REPORT?
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Select an option below to proceed with {details?.name} pre-analysis without re-selecting department.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleUploadReport}
                        className="px-5 py-3 bg-[#0F9D8A] hover:bg-teal-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
                      >
                        <Upload size={16} /> [ Upload Report ]
                      </button>
                      <button
                        onClick={handleEnterManually}
                        className="px-5 py-3 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
                      >
                        <FileSpreadsheet size={16} /> [ Enter Manually ]
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DepartmentDetailsModal;
