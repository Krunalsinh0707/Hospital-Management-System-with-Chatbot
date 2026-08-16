import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Edit3, ShieldCheck, ArrowLeft, Cpu, CheckCircle2, AlertCircle, FileSpreadsheet, Sparkles, Heart, Activity } from 'lucide-react';
import DepartmentSelectDrawer from '../../components/DepartmentSelectDrawer';
import DynamicMedicalForm from '../../components/DynamicMedicalForm';
import ReportProcessingUI from '../../components/ReportProcessingUI';
import AIPreAnalysisResult from '../../components/AIPreAnalysisResult';
import { uploadReportFile } from '../../services/medicalReportsService';
import { useNavigate, useLocation } from 'react-router-dom';

const OwnReportFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Workflow states:
  // 'SELECT_DEPT' -> 'CHOOSE_INPUT_METHOD' -> 'UPLOAD_UI' or 'MANUAL_FORM' -> 'PROCESSING' -> 'RESULT'
  const [step, setStep] = useState('SELECT_DEPT');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // File upload state
  const [file, setFile] = useState(null);
  const [processingStep, setProcessingStep] = useState(1);

  // Extraction & Analysis Result state
  const [aiResult, setAiResult] = useState(null);
  const [extractedParams, setExtractedParams] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // If coming with pre-selected department
    if (location.state?.departmentSlug) {
      const slug = location.state.departmentSlug;
      const deptName = location.state.departmentName || (slug.charAt(0).toUpperCase() + slug.slice(1));
      setSelectedDept({ slug, name: deptName });
      setIsDrawerOpen(false);

      if (location.state?.mode === 'UPLOAD') {
        setStep('UPLOAD_UI');
      } else if (location.state?.mode === 'MANUAL') {
        setStep('MANUAL_FORM');
      } else {
        setStep('CHOOSE_INPUT_METHOD');
      }
    } else {
      setIsDrawerOpen(true);
    }
  }, [location]);

  const handleDepartmentSelected = (dept) => {
    setSelectedDept(dept);
    setStep('CHOOSE_INPUT_METHOD');
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
        setAiResult(response.ai_pre_analysis);
        setExtractedParams(response.extracted_parameters);
        setStep('RESULT');
      }, 3800);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Failed to process report file. Please verify the document format.");
      setStep('CHOOSE_INPUT_METHOD');
    }
  };

  const handleManualFormSubmit = ({ parameters, aiResult: result }) => {
    setExtractedParams(parameters);
    setAiResult(result);
    setStep('RESULT');
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (step === 'RESULT' || step === 'CHOOSE_INPUT_METHOD' || step === 'MANUAL_FORM' || step === 'UPLOAD_UI') {
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
            Upload an existing diagnostic report from another hospital/lab or manually input clinical parameters for automated AI pre-analysis.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 2: CHOOSE INPUT METHOD */}
      {step === 'CHOOSE_INPUT_METHOD' && selectedDept && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
              HOW WOULD YOU LIKE TO PROVIDE YOUR REPORT?
            </h2>
            <p className="text-xs text-slate-500">
              Selected Department: <strong className="text-[#0F9D8A]">{selectedDept.name}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* CHOICE 1: UPLOAD REPORT */}
            <div
              onClick={() => setStep('UPLOAD_UI')}
              className="bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-[#0F9D8A] shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
                  <Upload size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0F9D8A] bg-teal-50 px-2.5 py-0.5 rounded">
                    AUTOMATED OCR
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-2 group-hover:text-[#0F9D8A] transition-colors">
                    UPLOAD REPORT
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                    Upload a PDF or image scan. Health Analyzer OCR will extract parameters automatically without manual typing.
                  </p>
                </div>
              </div>

              <button className="w-full py-4 bg-[#0F9D8A] hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-600/20">
                [ UPLOAD REPORT FILE ]
              </button>
            </div>

            {/* CHOICE 2: ENTER MANUALLY */}
            <div
              onClick={() => setStep('MANUAL_FORM')}
              className="bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-indigo-600 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
                  <Edit3 size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">
                    DYNAMIC PARAMETERS
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors">
                    ENTER MANUALLY
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                    Manually provide specific medical parameters for {selectedDept.name}. Only relevant diagnostic fields will be prompted.
                  </p>
                </div>
              </div>

              <button className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md">
                [ ENTER DATA MANUALLY ]
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 3A: UPLOAD REPORT UI */}
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
              Supported formats: PDF, JPG, JPEG, PNG (Max 10MB)
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
                onClick={() => setStep('CHOOSE_INPUT_METHOD')}
                className="px-5 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!file}
                className="px-6 py-3.5 bg-[#0F9D8A] hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-50"
              >
                [ ANALYZE REPORT NOW ]
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* STEP 3B: MANUAL PARAMETERS DYNAMIC FORM */}
      {step === 'MANUAL_FORM' && selectedDept && (
        <DynamicMedicalForm
          modelSlug={selectedDept.slug === 'cardiology' ? 'heart' : selectedDept.slug === 'endocrinology' ? 'diabetes' : selectedDept.slug === 'hematology' ? 'cbc' : selectedDept.slug}
          departmentName={selectedDept.name}
          onSubmitSuccess={handleManualFormSubmit}
          onCancel={() => setStep('CHOOSE_INPUT_METHOD')}
        />
      )}

      {/* STEP 4: PROCESSING STATUS */}
      {step === 'PROCESSING' && (
        <ReportProcessingUI currentStep={processingStep} fileInfo={file} />
      )}

      {/* STEP 5: FINAL RESULT */}
      {step === 'RESULT' && aiResult && (
        <AIPreAnalysisResult
          analysis={aiResult}
          extractedParameters={extractedParams}
          departmentName={selectedDept?.name}
          onDone={() => navigate('/my-reports')}
        />
      )}
    </div>
  );
};

export default OwnReportFlow;
