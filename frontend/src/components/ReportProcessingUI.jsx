import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Cpu, Loader2, FileText, Search, ShieldCheck } from 'lucide-react';

const ReportProcessingUI = ({ currentStep, fileInfo }) => {
  const steps = [
    { id: 1, label: 'File uploaded', desc: fileInfo ? `${fileInfo.name} (${(fileInfo.size / 1024).toFixed(1)} KB)` : 'Document verified' },
    { id: 2, label: 'OCR processing & parameter extraction', desc: 'Parsing digital medical parameters' },
    { id: 3, label: 'Validating information', desc: 'Checking unit reference ranges' },
    { id: 4, label: 'Detecting department', desc: 'Auto-matching clinical specialty' },
    { id: 5, label: 'Routing to department queue', desc: 'Matching clinical specialty & doctors' },
    { id: 6, label: 'Preparing doctor review queue', desc: 'Finalizing digital medical record' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-xl mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center mx-auto shadow-inner">
          <Cpu className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
          REPORT PROCESSING & EXTRACTION PIPELINE
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          MediNexus is executing OCR extraction and routing data for doctor clinical review.
        </p>
      </div>

      <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
        {steps.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-[#0F9D8A] animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-extrabold ${isDone ? 'text-slate-800' : isCurrent ? 'text-[#0F9D8A]' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ReportProcessingUI;
