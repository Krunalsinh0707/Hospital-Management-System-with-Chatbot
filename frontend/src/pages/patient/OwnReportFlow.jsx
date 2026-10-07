import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import DepartmentSelectDrawer from '../../components/DepartmentSelectDrawer';
import ReportProcessingUI from '../../components/ReportProcessingUI';
import { uploadReportFile } from '../../services/medicalReportsService';
import { useNavigate, useLocation } from 'react-router-dom';

const OwnReportFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Workflow states:
  // 'SELECT_DEPT' -> 'UPLOAD_UI' -> 'PROCESSING' -> 'RESULT'
  const [step, setStep] = useState('SELECT_DEPT');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // File upload state
  const [file, setFile] = useState(null);
  const [processingStep, setProcessingStep] = useState(1);

  // Extraction Result state
  const [extractedParams, setExtractedParams] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // If coming with pre-selected department
    if (location.state?.departmentSlug) {
      const slug = location.state.departmentSlug;
      const deptName = location.state.departmentName || (slug.charAt(0).toUpperCase() + slug.slice(1));
      setSelectedDept({ slug, name: deptName });
      setIsDrawerOpen(false);
      setStep('UPLOAD_UI');
    } else {
      setIsDrawerOpen(true);
    }
  }, [location]);

  const handleDepartmentSelected = (dept) => {
    setSelectedDept(dept);
    setStep('UPLOAD_UI');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setStep('PROCESSING');
    setProcessingStep(1);
    setErrorMessage('');

    try {
      setTimeout(() => setProcessingStep(2), 800);
      setTimeout(() => setProcessingStep(3), 1600);
      setTimeout(() => setProcessingStep(4), 2400);
      setTimeout(() => setProcessingStep(5), 3200);

      const response = await uploadReportFile(file, `External ${selectedDept?.name || 'Medical'} Report`);

      setTimeout(() => {
        setProcessingStep(6);
        setExtractedParams(response.extracted_parameters || {});
        setStep('RESULT');
      }, 3800);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Failed to process report file. Please verify the document format.");
      setStep('UPLOAD_UI');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (step === 'RESULT' || step === 'UPLOAD_UI') {
              setStep('SELECT_DEPT');
              setIsDrawerOpen(true);
            } else {
              navigate('/my-reports');
            }
          }}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to My Reports</span>
        </button>

        {selectedDept && (
          <div className="flex items-center gap-2 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            <span className="text-[10px] font-black text-[#0F9D8A] uppercase tracking-wider">
              Department: {selectedDept.name}
            </span>
          </div>
        )}
      </div>

      {/* STEP 1: Department Selection Drawer */}
      <DepartmentSelectDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectDepartment={handleDepartmentSelected}
      />

      {/* Main Flow Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black uppercase tracking-wider">
            <Sparkles size={14} /> Medical Analysis Workflow
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            I HAVE MY OWN REPORT
          </h1>
          <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
            Upload an existing diagnostic report from another hospital/lab for automated OCR extraction and routing to your doctor's clinical review queue.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 2: UPLOAD REPORT UI */}
      {step === 'UPLOAD_UI' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto"
        >
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
              UPLOAD MEDICAL REPORT FILE
            </h2>
            <p className="text-xs text-slate-500">
              Department: <strong className="text-[#0F9D8A]">{selectedDept?.name || 'General Medicine'}</strong> &bull; Formats: PDF, JPG, PNG (Max 10MB)
            </p>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 hover:border-[#0F9D8A] rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-teal-50/20 transition-all">
              <Upload size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="text-xs font-bold text-slate-700">Drag & Drop Report Here or Browse</p>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="mt-4 block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-[#0F9D8A] hover:file:bg-teal-100"
                required
              />
            </div>

            {file && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <FileText className="text-[#0F9D8A]" size={20} />
                  <div>
                    <p className="font-extrabold text-slate-900">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('SELECT_DEPT');
                  setIsDrawerOpen(true);
                }}
                className="px-5 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Change Department
              </button>
              <button
                type="submit"
                disabled={!file}
                className="px-6 py-3.5 bg-[#0F9D8A] hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-50"
              >
                [ UPLOAD & EXTRACT PARAMETERS ]
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* STEP 3: PROCESSING STATUS */}
      {step === 'PROCESSING' && (
        <ReportProcessingUI currentStep={processingStep} fileInfo={file} />
      )}

      {/* STEP 4: FINAL RESULT */}
      {step === 'RESULT' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              REPORT EXTRACTED & SUBMITTED
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Your diagnostic report has been validated and queued for physician review in <span className="font-bold text-slate-700">{selectedDept?.name || 'General Medicine'}</span>.
            </p>
          </div>

          {extractedParams && Object.keys(extractedParams).length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Extracted Clinical Parameters
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(extractedParams).map(([k, v]) => (
                  <div key={k} className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block truncate">{k}</span>
                    <span className="text-sm font-extrabold text-slate-800">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/my-reports')}
              className="px-6 py-3.5 bg-[#0F9D8A] hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
            >
              View My Reports
            </button>
            <button
              onClick={() => {
                setFile(null);
                setExtractedParams(null);
                setStep('UPLOAD_UI');
              }}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Upload Another
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OwnReportFlow;
