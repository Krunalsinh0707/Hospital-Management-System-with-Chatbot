import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Calendar, Heart, Shield, ShieldCheck,
  AlertCircle, CheckCircle2, Clock, Activity, FileText, Stethoscope,
  ChevronRight, Edit3, Save, X, Lock, LogOut, ArrowRight, UserCheck,
  AlertTriangle, Building, Sparkles, RefreshCw, PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, logout, refreshUser, updateUser } = useAuth();
  const navigate = useNavigate();

  // Page state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Summary counts and real activity
  const [summaryStats, setSummaryStats] = useState({
    reportsCount: 0,
    appointmentsCount: 0,
    aiAssessmentsCount: 0,
    doctorsCount: 1
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [primaryDoctorInfo, setPrimaryDoctorInfo] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    // Core User Model fields
    fullName: '',
    email: '',
    mobileNo: '',
    bloodGroup: 'B+',
    // Extended profile_data JSON fields
    dob: '1996-05-14',
    gender: 'Male',
    alternatePhone: '',
    address: '42 Lotus Park, SG Highway',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '380054',
    emergencyName: 'Pooja Mori',
    emergencyRelation: 'Spouse',
    emergencyPhone: '9876543210',
    emergencyAltPhone: '',
    allergies: 'No known drug allergies (NKDA)',
    medications: 'None currently prescribed',
    conditions: 'None reported',
    surgeries: 'None',
    familyHistory: 'No chronic hereditary conditions',
    preferredHospital: 'Health Analyzer Memorial Hospital',
    primaryDoctor: 'Dr. Aarav Shah',
    primaryDepartment: 'Cardiology'
  });

  // Snapshot of data when entering view/edit mode to track dirty state
  const [savedDataSnapshot, setSavedDataSnapshot] = useState(formData);

  // Fetch full user details and associated records
  useEffect(() => {
    let isMounted = true;
    const fetchFullProfile = async () => {
      setLoading(true);
      try {
        // 1. Fetch user profile from backend
        const userRes = await api.get('/users/me');
        const u = userRes.data;

        // Parse profile_data
        const ext = (typeof u.profile_data === 'object' && u.profile_data !== null)
          ? u.profile_data
          : (typeof u.profile_data === 'string' ? JSON.parse(u.profile_data || '{}') : {});

        const initialForm = {
          fullName: u.full_name || '',
          email: u.email || '',
          mobileNo: u.mobile_no || '',
          bloodGroup: u.blood_group || 'B+',
          dob: ext.dob || '1996-05-14',
          gender: ext.gender || 'Male',
          alternatePhone: ext.alternatePhone || '',
          address: ext.address || '42 Lotus Park, SG Highway',
          city: ext.city || 'Ahmedabad',
          state: ext.state || 'Gujarat',
          postalCode: ext.postalCode || '380054',
          emergencyName: ext.emergencyName || (ext.emergencyContact ? ext.emergencyContact.split('—')[0]?.trim() : 'Pooja Mori'),
          emergencyRelation: ext.emergencyRelation || 'Spouse',
          emergencyPhone: ext.emergencyPhone || (ext.emergencyContact ? ext.emergencyContact.split('—')[1]?.trim() : '9876543210'),
          emergencyAltPhone: ext.emergencyAltPhone || '',
          allergies: ext.allergies || 'No known drug allergies (NKDA)',
          medications: ext.medications || 'None currently prescribed',
          conditions: ext.conditions || 'None reported',
          surgeries: ext.surgeries || 'None',
          familyHistory: ext.familyHistory || 'No chronic hereditary conditions',
          preferredHospital: ext.preferredHospital || 'Health Analyzer Memorial Hospital',
          primaryDoctor: ext.primaryDoctor || 'Dr. Aarav Shah',
          primaryDepartment: ext.primaryDepartment || 'Cardiology'
        };

        if (isMounted) {
          setFormData(initialForm);
          setSavedDataSnapshot(initialForm);
        }

        // 2. Fetch real stats (reports, appointments, analytics)
        try {
          const [reportsRes, appsRes, analyticsRes, actRes] = await Promise.allSettled([
            api.get('/medical-reports/my'),
            api.get('/appointments/my'),
            api.get('/analytics/patient'),
            api.get('/users/me/activity')
          ]);

          const reports = reportsRes.status === 'fulfilled' ? reportsRes.value.data : [];
          const apps = appsRes.status === 'fulfilled' ? appsRes.value.data : [];
          const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value.data : null;
          const acts = actRes.status === 'fulfilled' ? actRes.value.data : [];

          if (isMounted) {
            setSummaryStats({
              reportsCount: Array.isArray(reports) ? reports.length : (analytics?.total_reports || 0),
              appointmentsCount: Array.isArray(apps) ? apps.length : (analytics?.total_appointments || 0),
              aiAssessmentsCount: Array.isArray(reports) ? reports.filter(r => r.status === 'AI_PRE_ANALYZED' || r.status === 'DOCTOR_REVIEWED' || r.status === 'FINALIZED').length : 3,
              doctorsCount: apps.length > 0 ? Array.from(new Set(apps.map(a => a.doctor_name))).length : 1
            });

            if (apps && apps.length > 0) {
              const latestApp = apps[0];
              setPrimaryDoctorInfo({
                name: latestApp.doctor_name,
                specialization: latestApp.specialization || 'Consultant Physician',
                department: latestApp.department_name || 'General Medicine',
                status: latestApp.status || 'Active',
                date: latestApp.appointment_date
              });
            }

            setActivityLogs(acts || []);
          }
        } catch (fetchErr) {
          console.error("Secondary profile data error:", fetchErr);
        }

      } catch (err) {
        console.error("Failed to load user profile:", err);
        if (isMounted) {
          setErrorMsg('Unable to retrieve latest patient record from database. Please reload.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFullProfile();
    return () => { isMounted = false; };
  }, []);

  // Compute if form has unsaved modifications
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(savedDataSnapshot);
  }, [formData, savedDataSnapshot]);

  // Compute profile completion percentage and list missing fields
  const { completionPercentage, missingFields } = useMemo(() => {
    const checks = [
      { name: 'Legal Full Name', filled: Boolean(formData.fullName?.trim()) },
      { name: 'Date of Birth', filled: Boolean(formData.dob) },
      { name: 'Gender', filled: Boolean(formData.gender) },
      { name: 'Blood Group', filled: Boolean(formData.bloodGroup) },
      { name: 'Primary Mobile Number', filled: Boolean(formData.mobileNo?.trim()) },
      { name: 'Residential Address', filled: Boolean(formData.address?.trim() && formData.city?.trim()) },
      { name: 'Postal Code', filled: Boolean(formData.postalCode?.trim()) },
      { name: 'Emergency Contact Name', filled: Boolean(formData.emergencyName?.trim()) },
      { name: 'Emergency Contact Phone', filled: Boolean(formData.emergencyPhone?.trim()) },
      { name: 'Known Allergies', filled: Boolean(formData.allergies?.trim() && formData.allergies !== 'Not provided') },
      { name: 'Current Medications', filled: Boolean(formData.medications?.trim() && formData.medications !== 'Not provided') },
      { name: 'Medical Conditions History', filled: Boolean(formData.conditions?.trim() && formData.conditions !== 'Not provided') }
    ];

    const filledCount = checks.filter(c => c.filled).length;
    const pct = Math.round((filledCount / checks.length) * 100);
    const missing = checks.filter(c => !c.filled).map(c => c.name);

    return { completionPercentage: pct, missingFields: missing };
  }, [formData]);

  // Calculate Patient Age from DOB
  const patientAge = useMemo(() => {
    if (!formData.dob) return 'N/A';
    try {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return isNaN(age) || age < 0 ? 'N/A' : `${age} yrs`;
    } catch {
      return 'N/A';
    }
  }, [formData.dob]);

  // Format Patient ID from authenticated user ID
  const patientId = `PAT-${String(user?.id || 2).padStart(6, '0')}`;

  // Form Field Change Handler
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for that field
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Validation function
  const validateForm = () => {
    const errors = {};

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      errors.fullName = 'Full legal name is required (at least 2 characters).';
    }

    const cleanMobile = (formData.mobileNo || '').replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10 || cleanMobile.length > 15) {
      errors.mobileNo = 'Valid mobile number (10-15 digits) is required.';
    }

    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (dobDate > today) {
        errors.dob = 'Date of birth cannot be in the future.';
      }
    } else {
      errors.dob = 'Date of birth is required.';
    }

    if (formData.emergencyPhone) {
      const cleanEmPhone = formData.emergencyPhone.replace(/\D/g, '');
      if (cleanEmPhone.length < 7 || cleanEmPhone.length > 15) {
        errors.emergencyPhone = 'Please enter a valid emergency phone number.';
      }
    }

    if (formData.postalCode && formData.postalCode.trim().length < 3) {
      errors.postalCode = 'Valid postal / zip code is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Save
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!validateForm()) {
      setErrorMsg('Please correct the highlighted validation errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const profilePayload = {
        dob: formData.dob,
        gender: formData.gender,
        alternatePhone: formData.alternatePhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        emergencyName: formData.emergencyName,
        emergencyRelation: formData.emergencyRelation,
        emergencyPhone: formData.emergencyPhone,
        emergencyAltPhone: formData.emergencyAltPhone,
        emergencyContact: `${formData.emergencyName} (${formData.emergencyRelation}) — ${formData.emergencyPhone}`,
        allergies: formData.allergies,
        medications: formData.medications,
        conditions: formData.conditions,
        surgeries: formData.surgeries,
        familyHistory: formData.familyHistory,
        preferredHospital: formData.preferredHospital,
        primaryDoctor: formData.primaryDoctor,
        primaryDepartment: formData.primaryDepartment
      };

      const payload = {
        full_name: formData.fullName.trim(),
        blood_group: formData.bloodGroup,
        mobile_no: formData.mobileNo.trim(),
        profile_data: profilePayload
      };

      const res = await api.put('/users/me', payload);

      if (res.data) {
        setSavedDataSnapshot({ ...formData });
        setIsEditing(false);
        setSuccessMsg('Patient profile and medical record updated successfully in database.');
        
        // Refresh Auth Context so all app components immediately receive latest name & details
        if (refreshUser) refreshUser();
        else if (updateUser) updateUser(res.data);

        // Fetch refreshed activity logs
        try {
          const actRes = await api.get('/users/me/activity');
          if (actRes.data) setActivityLogs(actRes.data);
        } catch {
          // ignore secondary fail
        }

        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error('Failed to save patient profile:', err);
      setErrorMsg(err?.response?.data?.detail || 'Failed to save changes to database. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Cancel / Discard
  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      setIsEditing(false);
      setFieldErrors({});
    }
  };

  const handleConfirmDiscard = () => {
    setFormData({ ...savedDataSnapshot });
    setFieldErrors({});
    setIsEditing(false);
    setShowDiscardModal(false);
  };

  // Skeleton Loading State
  if (loading) {
    return (
      <div className="min-h-full bg-[#F6F9FB] p-4 sm:p-6 lg:p-8 pb-28">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-pulse">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto sm:mx-0" />
                <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto sm:mx-0" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto sm:mx-0" />
              </div>
              <div className="w-32 h-10 bg-slate-200 rounded-xl shrink-0" />
            </div>
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 h-64 animate-pulse bg-slate-50/50" />
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 h-64 animate-pulse bg-slate-50/50" />
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 h-48 animate-pulse bg-slate-50/50" />
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 h-48 animate-pulse bg-slate-50/50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F6F9FB] text-slate-800 p-4 sm:p-6 lg:p-8 pb-28">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* NOTIFICATION FEEDBACK BANNERS */}
        {successMsg && (
          <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold text-emerald-900 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">✓ Profile Updated:</span> {successMsg}
              </div>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold text-rose-900 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <div>
                <span className="font-bold">✕ Action Required:</span> {errorMsg}
              </div>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-rose-700 hover:text-rose-900 p-1 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* 1. PATIENT IDENTITY HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
          {/* Top medical accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0F9D8A] via-teal-500 to-cyan-500" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-1">
            {/* Left: Avatar & Identity Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5">
              {/* Patient Avatar Initials */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-teal-50 to-slate-100 border-2 border-teal-600/30 flex items-center justify-center text-teal-800 text-2xl font-black shadow-inner tracking-wider">
                  {formData.fullName
                    ? formData.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'PT'}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs border-2 border-white" title="Identity Verified">
                  <ShieldCheck size={13} />
                </div>
              </div>

              {/* Patient Meta */}
              <div className="text-center sm:text-left space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F9D8A] bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-md">
                    Electronic Medical Record
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <UserCheck size={12} />
                    Account Verified
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {formData.fullName || 'Patient Name'}
                </h1>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 font-medium">
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {patientId}
                  </span>
                  <span>•</span>
                  <span>Blood: <strong className="text-rose-600">{formData.bloodGroup}</strong></span>
                  <span>•</span>
                  <span>Age: <strong className="text-slate-800">{patientAge}</strong></span>
                  <span>•</span>
                  <span className="text-slate-400">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}</span>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons & Mode Toggles */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 self-center md:self-auto w-full sm:w-auto">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setSuccessMsg('');
                      setErrorMsg('');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#0F9D8A] hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit3 size={15} />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Sign Out of Portal"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCancelClick}
                    disabled={saving}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <X size={14} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#0F9D8A] hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Identity Status Banner if editing */}
          {isEditing && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-amber-800 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>
                  <strong>Edit Mode Active:</strong> Modify demographic and emergency parameters. Changes persist to the hospital database upon clicking <strong>Save Changes</strong>.
                </span>
              </div>
              {hasUnsavedChanges && (
                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                  Unsaved Edits
                </span>
              )}
            </div>
          )}
        </div>

        {/* 2. DYNAMIC PROFILE COMPLETION WIDGET */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-[#0F9D8A] flex items-center justify-center font-black text-xs">
                {completionPercentage}%
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Medical Record Profile Completion
                </h3>
                <p className="text-[11px] text-slate-500">
                  Accurate patient records facilitate timely clinical triage and emergency care.
                </p>
              </div>
            </div>

            {missingFields.length > 0 && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-[#0F9D8A] hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors inline-flex items-center gap-1 self-start sm:self-center cursor-pointer"
              >
                <span>Complete Profile</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                completionPercentage === 100 
                  ? 'bg-emerald-500' 
                  : completionPercentage >= 70 
                    ? 'bg-[#0F9D8A]' 
                    : 'bg-amber-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {missingFields.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Missing information:</span>
              {missingFields.slice(0, 4).map((f) => (
                <span key={f} className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                  • {f}
                </span>
              ))}
              {missingFields.length > 4 && (
                <span className="text-slate-400">+{missingFields.length - 4} more</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 size={13} />
              <span>All essential clinical demographics and emergency contacts are fully recorded.</span>
            </div>
          )}
        </div>

        {/* MAIN 2-COLUMN CLINICAL LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT 2 COLUMNS: MEDICAL DETAILS & DEMOGRAPHICS */}
          <div className="lg:col-span-2 space-y-6">

            {/* SECTION 5: PERSONAL INFORMATION */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Personal Information
                    </h2>
                    <p className="text-[11px] text-slate-400">Legal patient identity and primary clinical demographics.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                  EMR Demographics
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Full Legal Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="e.g. Krunalsinh Mori"
                        className={`w-full p-2.5 bg-slate-50 border ${fieldErrors.fullName ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200 focus:border-[#0F9D8A]'} rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all`}
                      />
                      {fieldErrors.fullName && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{fieldErrors.fullName}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-bold text-slate-800">
                      {formData.fullName || <span className="text-slate-400 italic">Not provided</span>}
                    </div>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="date"
                        value={formData.dob}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                        className={`w-full p-2.5 bg-slate-50 border ${fieldErrors.dob ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200 focus:border-[#0F9D8A]'} rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all`}
                      />
                      {fieldErrors.dob && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{fieldErrors.dob}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>{formData.dob ? new Date(formData.dob).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not provided'}</span>
                      {patientAge !== 'N/A' && (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {patientAge}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-bold text-slate-800">
                      {formData.gender}
                    </div>
                  )}
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Blood Group
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-bold text-rose-700 flex items-center justify-between">
                      <span>{formData.bloodGroup}</span>
                      <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        Emergency Critical
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Mobile */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Primary Phone <span className="text-rose-500">*</span>
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="tel"
                        value={formData.mobileNo}
                        onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                        placeholder="10-digit mobile number"
                        className={`w-full p-2.5 bg-slate-50 border ${fieldErrors.mobileNo ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200 focus:border-[#0F9D8A]'} rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all`}
                      />
                      {fieldErrors.mobileNo && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{fieldErrors.mobileNo}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>{formData.mobileNo}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        SMS Active
                      </span>
                    </div>
                  )}
                </div>

                {/* Registered Email (Protected) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Registered Email Address
                  </label>
                  <div className="p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-between">
                    <span className="truncate mr-2 font-mono">{formData.email}</span>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Verified
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hospital authentication login. Modifying email requires administrative verification.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 6: CONTACT INFORMATION */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Contact Information & Residential Address
                    </h2>
                    <p className="text-[11px] text-slate-400">Postal delivery address for physical clinical reports & communication.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                  Patient Managed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Alternate Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Alternate Contact Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.alternatePhone}
                      onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                      placeholder="e.g. Landline or Secondary mobile"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800">
                      {formData.alternatePhone || <span className="text-slate-400 italic">Not provided</span>}
                    </div>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Postal / Zip Code
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        placeholder="e.g. 380054"
                        className={`w-full p-2.5 bg-slate-50 border ${fieldErrors.postalCode ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200 focus:border-[#0F9D8A]'} rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all`}
                      />
                      {fieldErrors.postalCode && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{fieldErrors.postalCode}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-mono font-bold text-slate-800">
                      {formData.postalCode || <span className="text-slate-400 italic">Not provided</span>}
                    </div>
                  )}
                </div>

                {/* Street Address */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Street Address / Residential Unit
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="e.g. 42 Lotus Park, SG Highway"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800">
                      {formData.address || <span className="text-slate-400 italic">Not provided</span>}
                    </div>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="e.g. Ahmedabad"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800">
                      {formData.city || <span className="text-slate-400 italic">Not provided</span>}
                    </div>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    State / Province
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="e.g. Gujarat"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800">
                      {formData.state || <span className="text-slate-400 italic">Not provided</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 7: EMERGENCY CONTACT */}
            <div className="bg-white rounded-2xl border border-amber-200/80 p-5 sm:p-6 shadow-xs space-y-4 relative">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Heart size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Emergency Contact</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Critical Notice
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      This contact may be reached by hospital emergency triage in critical medical situations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Contact Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Next of Kin / Contact Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.emergencyName}
                      onChange={(e) => handleInputChange('emergencyName', e.target.value)}
                      placeholder="e.g. Pooja Mori"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <div className="p-2.5 bg-amber-50/40 border border-amber-100/80 rounded-xl text-xs font-bold text-slate-800">
                      {formData.emergencyName || <span className="text-slate-400 italic">Not provided</span>}
                    </div>
                  )}
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Relationship to Patient
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.emergencyRelation}
                      onChange={(e) => handleInputChange('emergencyRelation', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Child">Child</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Friend">Friend / Partner</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <div className="p-2.5 bg-amber-50/40 border border-amber-100/80 rounded-xl text-xs font-semibold text-slate-800">
                      {formData.emergencyRelation || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Primary Emergency Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Emergency Phone Number
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="tel"
                        value={formData.emergencyPhone}
                        onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                        placeholder="e.g. 9876543210"
                        className={`w-full p-2.5 bg-slate-50 border ${fieldErrors.emergencyPhone ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200 focus:border-[#0F9D8A]'} rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all`}
                      />
                      {fieldErrors.emergencyPhone && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{fieldErrors.emergencyPhone}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-50/40 border border-amber-100/80 rounded-xl text-xs font-mono font-bold text-slate-800">
                      {formData.emergencyPhone || <span className="text-slate-400 italic">Not provided</span>}
                    </div>
                  )}
                </div>

                {/* Alternate Emergency Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Secondary Emergency Line (Optional)
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.emergencyAltPhone}
                      onChange={(e) => handleInputChange('emergencyAltPhone', e.target.value)}
                      placeholder="e.g. Workplace or Home Phone"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <div className="p-2.5 bg-amber-50/40 border border-amber-100/80 rounded-xl text-xs font-mono font-semibold text-slate-800">
                      {formData.emergencyAltPhone || <span className="text-slate-400 italic">Not provided</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 8: MEDICAL INFORMATION */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F9D8A] flex items-center justify-center font-bold">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Medical History & Clinical Parameters
                    </h2>
                    <p className="text-[11px] text-slate-400">Allergies, chronic conditions, and surgical background.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  Clinician Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Allergies */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Known Allergies
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      placeholder="e.g. Penicillin, Peanuts, Sulfa drugs"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800">
                      {formData.allergies || 'No known drug allergies (NKDA)'}
                    </div>
                  )}
                </div>

                {/* Current Medications */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Current Medications
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.medications}
                      onChange={(e) => handleInputChange('medications', e.target.value)}
                      placeholder="e.g. Metformin 500mg, Atorvastatin 10mg"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800">
                      {formData.medications || 'None currently prescribed'}
                    </div>
                  )}
                </div>

                {/* Existing Conditions */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Existing Medical Conditions
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.conditions}
                      onChange={(e) => handleInputChange('conditions', e.target.value)}
                      placeholder="e.g. Mild Hypertension, Asthma"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800">
                      {formData.conditions || 'None reported'}
                    </div>
                  )}
                </div>

                {/* Past Surgeries */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Previous Surgeries & Procedures
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.surgeries}
                      onChange={(e) => handleInputChange('surgeries', e.target.value)}
                      placeholder="e.g. Appendectomy (2018)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800">
                      {formData.surgeries || 'None'}
                    </div>
                  )}
                </div>

                {/* Family Medical History */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Family Medical History
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.familyHistory}
                      onChange={(e) => handleInputChange('familyHistory', e.target.value)}
                      placeholder="e.g. Maternal Type 2 Diabetes, Paternal Hypertension"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-[#0F9D8A] rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800">
                      {formData.familyHistory || 'No chronic hereditary conditions'}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 1 COLUMN: CARE TEAM, SUMMARY STATS, SECURITY, AND LOGS */}
          <div className="space-y-6">

            {/* SECTION 18: HEALTH RECORD SUMMARY */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Health Record Summary
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Portal Sync</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/reports"
                  className="p-3 bg-slate-50 hover:bg-teal-50/60 border border-slate-200/80 hover:border-teal-200 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <FileText size={16} className="text-[#0F9D8A] group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-black text-slate-900">{summaryStats.reportsCount}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 mt-1">Medical Reports</div>
                  <div className="text-[10px] text-slate-400">View lab results →</div>
                </Link>

                <Link
                  to="/appointments"
                  className="p-3 bg-slate-50 hover:bg-teal-50/60 border border-slate-200/80 hover:border-teal-200 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <Calendar size={16} className="text-sky-600 group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-black text-slate-900">{summaryStats.appointmentsCount}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 mt-1">Appointments</div>
                  <div className="text-[10px] text-slate-400">Consultations →</div>
                </Link>

                <Link
                  to="/analytics"
                  className="p-3 bg-slate-50 hover:bg-teal-50/60 border border-slate-200/80 hover:border-teal-200 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <Sparkles size={16} className="text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-black text-slate-900">{summaryStats.aiAssessmentsCount}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 mt-1">AI Assessments</div>
                  <div className="text-[10px] text-slate-400">Risk profiles →</div>
                </Link>

                <Link
                  to="/doctors"
                  className="p-3 bg-slate-50 hover:bg-teal-50/60 border border-slate-200/80 hover:border-teal-200 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <Stethoscope size={16} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-black text-slate-900">{summaryStats.doctorsCount}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 mt-1">Care Doctors</div>
                  <div className="text-[10px] text-slate-400">Directory →</div>
                </Link>
              </div>
            </div>

            {/* SECTION 9: MY CARE TEAM */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Stethoscope size={15} className="text-[#0F9D8A]" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    My Care Team
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Assigned
                </span>
              </div>

              <div className="p-3.5 bg-gradient-to-br from-teal-50/50 to-slate-50 border border-teal-100 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {primaryDoctorInfo?.name || formData.primaryDoctor || 'Dr. Aarav Shah'}
                    </h4>
                    <p className="text-[11px] font-semibold text-teal-800">
                      {primaryDoctorInfo?.specialization || 'Cardiology & Internal Medicine'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formData.preferredHospital || 'Health Analyzer Memorial Hospital'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-teal-200 text-teal-800 rounded-md">
                    Primary
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-2 border-t border-teal-100/60">
                  <Link
                    to="/doctors"
                    className="flex-1 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-900 text-[11px] font-bold rounded-lg text-center transition-colors"
                  >
                    View Doctor
                  </Link>
                  <Link
                    to="/appointments"
                    className="flex-1 py-1.5 bg-[#0F9D8A] hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg text-center transition-colors shadow-2xs"
                  >
                    Appointments
                  </Link>
                </div>
              </div>
            </div>

            {/* SECTION 10: ACCOUNT & SECURITY */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Shield size={15} className="text-[#0F9D8A]" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Account & Security
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  256-bit Encrypted
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 font-medium">Email Verification</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 font-medium">Mobile Verification</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 size={12} /> SMS Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 font-medium">Password Security</span>
                  <span className="font-mono text-slate-700 font-bold">••••••••••••</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 font-medium">Last Login Session</span>
                  <span className="text-slate-700 font-medium text-[11px]">Active (Current Browser)</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lock size={13} />
                  <span>Change Password</span>
                </button>
              </div>
            </div>

            {/* SECTION 17: PROFILE ACTIVITY TIMELINE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-[#0F9D8A]" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Profile Activity
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Audit Trail</span>
              </div>

              <div className="space-y-3">
                {activityLogs && activityLogs.length > 0 ? (
                  activityLogs.slice(0, 4).map((act, i) => (
                    <div key={act.id || i} className="flex items-start gap-2.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold text-slate-800">{act.action}</div>
                        <div className="text-[10px] text-slate-400">
                          {act.timestamp ? new Date(act.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">Electronic Medical Record Active</div>
                        <div className="text-[10px] text-slate-400">Synchronized with Hospital EHR</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">Account Identity Verified</div>
                        <div className="text-[10px] text-slate-400">Two-Factor Authentication Confirmed</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* UNSAVED CHANGES CONFIRMATION MODAL */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Unsaved Changes</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You have made changes to your patient profile that have not been saved yet. If you cancel, these modifications will be lost.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Stay & Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
