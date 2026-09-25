import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Building, Eye, Search, Calendar, Heart, Brain, Bone, 
  Wind, Droplets, Activity, Zap
} from 'lucide-react';
import { getDepartments } from '../../services/hospitalService';
import DepartmentDetailsModal from '../../components/DepartmentDetailsModal';

// Specialty icon helper
const getDeptIcon = (code = '', name = '') => {
  const text = (code + ' ' + name).toLowerCase();
  if (text.includes('cardio') || text.includes('heart')) return <Heart size={18} className="text-rose-500" />;
  if (text.includes('neuro') || text.includes('brain')) return <Brain size={18} className="text-purple-500" />;
  if (text.includes('ortho') || text.includes('bone')) return <Bone size={18} className="text-[#0F9D8A]" />;
  if (text.includes('pulm') || text.includes('chest') || text.includes('lung')) return <Wind size={18} className="text-sky-500" />;
  if (text.includes('hema') || text.includes('blood') || text.includes('cbc')) return <Droplets size={18} className="text-rose-600" />;
  if (text.includes('diabet') || text.includes('endo')) return <Zap size={18} className="text-amber-500" />;
  if (text.includes('nephro') || text.includes('kidney')) return <Activity size={18} className="text-indigo-500" />;
  return <Building size={18} className="text-[#0F9D8A]" />;
};

const DepartmentsPage = () => {
  const navigate = useNavigate();
  const { deptSlug } = useParams();
  
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalSlug, setActiveModalSlug] = useState(null);
  const [selectedDeptData, setSelectedDeptData] = useState(null);

  useEffect(() => {
    fetchDepts();
  }, [deptSlug]);

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data || []);
      
      if (deptSlug && data && data.length > 0) {
        const matched = data.find(d => 
          d.slug === deptSlug || 
          d.name.toLowerCase().replace(/\s+/g, '-') === deptSlug.toLowerCase() ||
          d.code.toLowerCase() === deptSlug.toLowerCase()
        );
        if (matched) {
          openDetailsModal(matched);
        }
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (dept) => {
    const slug = dept.slug || dept.name.toLowerCase().replace(/\s+/g, '-');
    setActiveModalSlug(slug);
    setSelectedDeptData(dept);
    setIsModalOpen(true);
  };

  const filteredDepartments = departments.filter((d) => {
    const matchesSearch = 
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F6F9FB] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F9D8A] bg-teal-50 px-2.5 py-0.5 rounded">
                Hospital Specialties
              </span>
              <span className="text-xs text-slate-400 font-medium">• Clinical Care Units</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Medical Departments Directory</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore clinical specialties, consultant physicians, diagnostic capabilities, and scheduled consultations.
            </p>
          </div>

          <button
            onClick={() => navigate('/appointments')}
            className="px-4 py-2 bg-[#0F9D8A] hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 self-start sm:self-center shrink-0"
          >
            <Calendar size={14} />
            <span>Book Consultation</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by department name or clinical specialty..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#0F9D8A] transition-colors"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800 font-bold">{filteredDepartments.length}</strong> of {departments.length} Clinical Specialties
          </div>
        </div>

        {/* Department Grid - Balanced 3-column layout */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                  <div className="w-24 h-4 bg-slate-200 rounded" />
                </div>
                <div className="w-full h-12 bg-slate-50 rounded" />
                <div className="w-full h-8 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <Building size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No departments match your search</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please check your spelling or search by general specialty term.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDepartments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {getDeptIcon(dept.code, dept.name)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      {dept.code}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{dept.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {dept.description || 'Comprehensive clinical diagnosis, outpatient consultations, and specialized inpatient therapies.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => openDetailsModal(dept)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye size={13} />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={() => navigate('/appointments', { state: { departmentId: dept.id, departmentSlug: dept.slug } })}
                    className="py-2 px-3 bg-[#0F9D8A] hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="Book consultation with this department"
                  >
                    <Calendar size={13} />
                    <span>Book</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Interactive Department Details Modal */}
      <DepartmentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        departmentSlug={activeModalSlug}
        departmentData={selectedDeptData}
      />
    </div>
  );
};

export default DepartmentsPage;
