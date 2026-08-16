import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Info, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { getModelSchema, runAIAnalysis } from '../services/modelRegistryService';

const DynamicMedicalForm = ({ modelSlug, departmentName, onSubmitSuccess, onCancel }) => {
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchema();
  }, [modelSlug]);

  const fetchSchema = async () => {
    setLoadingSchema(true);
    setError('');
    try {
      const data = await getModelSchema(modelSlug);
      setSchema(data);
      // Initialize form defaults
      const initial = {};
      if (data && data.fields) {
        data.fields.forEach(f => {
          if (f.default !== undefined) {
            initial[f.name] = f.default;
          } else if (f.type === 'select' && f.options && f.options.length > 0) {
            initial[f.name] = f.options[0].value;
          } else {
            initial[f.name] = '';
          }
        });
      }
      setFormData(initial);
    } catch (err) {
      console.error("Failed to load schema:", err);
      setError("Unable to load dynamic parameter schema. Using default parameters.");
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // Cast numeric inputs
      const payload = {};
      if (schema && schema.fields) {
        schema.fields.forEach(f => {
          const val = formData[f.name];
          if (f.type === 'number') {
            payload[f.name] = val === '' ? 0 : Number(val);
          } else {
            payload[f.name] = val;
          }
        });
      } else {
        Object.assign(payload, formData);
      }

      const result = await runAIAnalysis(modelSlug, payload);
      if (onSubmitSuccess) {
        onSubmitSuccess({ parameters: payload, aiResult: result });
      }
    } catch (err) {
      console.error("Dynamic analysis failed:", err);
      setError(err?.response?.data?.detail || "Failed to process manual parameters with AI engine.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSchema) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center py-16">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-[#0F9D8A] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
          Fetching {departmentName} Medical Field Schema...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0F9D8A] bg-teal-50 px-2.5 py-0.5 rounded">
            DYNAMIC PARAMETER FORM
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            {departmentName} Medical Parameters
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Only relevant diagnostic parameters for {departmentName} are shown below.
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200"
          >
            ← Change Department
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schema?.fields?.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                {field.unit && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {field.unit}
                  </span>
                )}
              </div>

              {field.type === 'select' ? (
                <select
                  value={formData[field.name] !== undefined ? formData[field.name] : ''}
                  onChange={(e) => handleChange(field.name, Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-[#0F9D8A]"
                  required={field.required}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  step={field.type === 'number' ? 'any' : undefined}
                  value={formData[field.name] !== undefined ? formData[field.name] : ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-[#0F9D8A]"
                  required={field.required}
                />
              )}

              {field.description && (
                <p className="text-[10px] text-slate-400 font-medium">{field.description}</p>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3.5 bg-[#0F9D8A] hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-teal-600/20 flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running AI Pre-Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Run AI Pre-Analysis</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default DynamicMedicalForm;
