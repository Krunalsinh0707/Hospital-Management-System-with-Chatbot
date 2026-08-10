import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, FileText, Calendar, Activity, Heart, AlertTriangle, Clock, ArrowRight, Eye, Download, Filter
} from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import { useReports } from '../context/ReportContext';
import ClinicalHeader from '../components/ClinicalHeader';
import { useLayout } from '../App';
import api from '../services/api';

const History = () => {
  const { reports, loading, error } = useReports();
  const { toggleSidebar } = useLayout();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [downloadingId, setDownloadingId] = useState(null);

  const downloadPdf = async (type, id) => {
    setDownloadingId(id);
    try {
      const response = await api.get(`/reports/pdf/${type}/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF download failed", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredDocs = reports.filter(doc => {
    const matchesSearch = 
      (doc.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'All' || doc.category === filterType;
    return matchesSearch && matchesFilter;
  });

  const getRiskColor = (doc) => {
    const pred = (doc.prediction || doc.diabetes_prediction || '').toString().toLowerCase();
    if (pred.includes('high') || pred.includes('positive')) return 'rose';
    if (pred.includes('moderate') || pred.includes('warning')) return 'amber';
    return 'emerald';
  };

  const getIcon = (type) => {
    switch(type) {
      case 'diabetes': return <Activity size={18} className="text-teal-500" />;
      case 'heart': return <Heart size={18} className="text-rose-500" />;
      case 'hypertension': return <AlertTriangle size={18} className="text-amber-500" />;
      case 'cbc': return <FileText size={18} className="text-blue-500" />;
      default: return <Clock size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className="clinical-page-container">
      <div className="grid grid-cols-12 gap-6">
        <ClinicalHeader 
          title="Clinical Assessment History" 
          subtitle="Comprehensive historical record of all patient neural logs" 
          onMenuClick={toggleSidebar}
        />

        <div className="col-span-12">
          <FloatingCard padding="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {['All', 'Diabetes', 'Cardiovascular', 'Hypertension', 'CBC Analysis'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all border ${
                      filterType === type 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' 
                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search assessment logs..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-[#0F9D8A] transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="clinical-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Analysis ID</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Finding</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode="popLayout">
                      {filteredDocs.map((doc, idx) => {
                        const color = getRiskColor(doc);
                        return (
                          <motion.tr 
                            key={`${doc.type}-${doc.id}-${idx}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-slate-50/30 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                  {getIcon(doc.type)}
                                </div>
                                <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{doc.category}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-400">#DH-{doc.id?.toString().padStart(4, '0')}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border bg-${color}-50 text-${color}-600 border-${color}-100`}>
                                {doc.type === 'diabetes' ? doc.diabetes_prediction : (doc.prediction || 'Scan Complete')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full bg-${color}-500`} 
                                    style={{ width: `${(doc.probability > 1 ? doc.probability : (doc.probability || 0) * 100)}%` }} 
                                  />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 tracking-tighter">
                                  {doc.probability 
                                    ? `${(doc.probability > 1 ? doc.probability : doc.probability * 100).toFixed(1)}%` 
                                    : '---'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-500">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button className="p-2 text-slate-400 hover:text-[#0F9D8A] hover:bg-teal-50 rounded-lg transition-all" title="View Details">
                                  <Eye size={16} />
                                </button>
                                <button 
                                  onClick={() => downloadPdf(doc.type, doc.id)} 
                                  disabled={downloadingId === doc.id}
                                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" 
                                  title="Download PDF Clinical Report"
                                >
                                  <Download size={16} className={downloadingId === doc.id ? 'animate-bounce text-[#0F9D8A]' : ''} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>

                {filteredDocs.length === 0 && (
                  <div className="py-20 text-center">
                    <Clock size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No diagnostic records found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredDocs.length} of {reports.length} assessment logs</p>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-slate-100 rounded text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50">Prev</button>
                <button className="px-3 py-1 border border-slate-100 rounded text-[10px] font-black uppercase text-slate-900 bg-slate-50">Next</button>
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default History;
