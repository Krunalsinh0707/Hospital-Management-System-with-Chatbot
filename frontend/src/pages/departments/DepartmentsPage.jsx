import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Hospital, UserCheck, Stethoscope, ArrowRight, ChevronRight, Eye, Sparkles } from 'lucide-react';
import { getDepartments, getDepartmentDoctors } from '../../services/hospitalService';
import DepartmentDetailsModal from '../../components/DepartmentDetailsModal';

const DepartmentsPage = () => {
  const navigate = useNavigate();
  const { deptSlug } = useParams();
  
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalSlug, setActiveModalSlug] = useState(null);

  useEffect(() => {
    fetchDepts();
  }, [deptSlug]);

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data || []);
      
      if (data && data.length > 0) {
        let target = data[0];
        if (deptSlug) {
          const matched = data.find(d => 
            d.slug === deptSlug || 
            d.name.toLowerCase().replace(/\s+/g, '-') === deptSlug.toLowerCase() ||
            d.code.toLowerCase() === deptSlug.toLowerCase()
          );
          if (matched) target = matched;
        }
        handleSelectDept(target);

        if (deptSlug) {
          setActiveModalSlug(deptSlug);
          setIsModalOpen(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDept = async (dept) => {
    setSelectedDept(dept);
    try {
      const docs = await getDepartmentDoctors(dept.id);
      setDoctors(docs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openDetailsModal = (dept) => {
    const slug = dept.slug || dept.name.toLowerCase().replace(/\s+/g, '-');
    setActiveModalSlug(slug);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
        <Link to="/" className="hover:text-[#0F9D8A] transition-colors">Home</Link>
        <ChevronRight size={14} />
        <span className="text-slate-600">Departments</span>
        {selectedDept && (
          <>
            <ChevronRight size={14} />
            <span className="text-[#0F9D8A]">{selectedDept.name}</span>
          </>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-[#0F9D8A] uppercase tracking-widest bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
            HOSPITAL SPECIALTIES DIRECTORY
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase mt-1">
            MEDICAL DEPARTMENTS
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Explore clinical specialties, consultant physicians, AI capabilities, and medical report services.
          </p>
        </div>

        {selectedDept && (
          <button
            onClick={() => openDetailsModal(selectedDept)}
            className="px-5 py-3 bg-[#0F9D8A] hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Sparkles size={16} /> Open {selectedDept.name} Details
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Departments Directory Grid */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Departments Directory ({departments.length})</h2>
          {departments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => {
                handleSelectDept(dept);
                openDetailsModal(dept);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                selectedDept?.id === dept.id 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                  : 'bg-white text-slate-900 border-slate-200 hover:border-[#0F9D8A] hover:shadow-md'
              }`}
            >
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                  selectedDept?.id === dept.id ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-50 text-[#0F9D8A]'
                }`}>
                  {dept.code}
                </span>
                <h3 className="text-sm font-extrabold mt-1 group-hover:text-[#0F9D8A] transition-colors">{dept.name}</h3>
                <p className="text-[11px] opacity-75 line-clamp-1 mt-0.5">{dept.description}</p>
              </div>
              <ArrowRight size={16} className={selectedDept?.id === dept.id ? 'text-teal-400' : 'text-slate-400 group-hover:translate-x-1 transition-transform'} />
            </div>
          ))}
        </div>

        {/* Selected Department Overview & Active Doctors */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDept && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black text-[#0F9D8A] uppercase tracking-widest">{selectedDept.code} DEPARTMENT</span>
                  <h2 className="text-2xl font-black text-slate-900">{selectedDept.name}</h2>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{selectedDept.description}</p>
                </div>
                <button
                  onClick={() => openDetailsModal(selectedDept)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-[#0F9D8A] text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Eye size={14} /> Full Details
                </button>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                  <Stethoscope size={18} className="text-[#0F9D8A]" /> Active Consultant Physicians ({doctors.length})
                </h3>

                {doctors.length === 0 ? (
                  <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                    <p className="text-xs text-slate-500 font-bold">No active doctors registered in this department yet.</p>
                    <button
                      onClick={() => navigate('/appointments', { state: { departmentId: selectedDept.id, departmentSlug: selectedDept.slug } })}
                      className="px-4 py-2 bg-[#0F9D8A] text-white text-xs font-bold rounded-xl shadow-sm"
                    >
                      Request Department Consultation
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.map((doc) => (
                      <div key={doc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F9D8A] font-bold flex items-center justify-center border border-teal-100">
                            Dr
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">{doc.full_name}</h4>
                            <p className="text-[10px] font-medium text-slate-500">{doc.specialization}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 font-medium flex justify-between items-center">
                          <span>{doc.qualification} • {doc.experience_years} yrs exp</span>
                          <button
                            onClick={() => navigate('/appointments', { state: { departmentId: selectedDept.id, doctorId: doc.id } })}
                            className="px-2.5 py-1 bg-[#0F9D8A] text-white font-bold rounded-lg hover:bg-teal-700 transition-colors"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Department Details Modal */}
      <DepartmentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        departmentSlug={activeModalSlug}
        departmentData={selectedDept}
      />
    </div>
  );
};

export default DepartmentsPage;
