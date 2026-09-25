import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Stethoscope, Building, Calendar, Search, 
  Award, Clock, CheckCircle2, ChevronRight, Filter, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllDoctors, getDepartments } from '../../services/hospitalService';

const DoctorsPage = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [docs, depts] = await Promise.all([
          getAllDoctors().catch(() => []),
          getDepartments().catch(() => [])
        ]);
        setDoctors(docs || []);
        setDepartments(depts || []);
      } catch (err) {
        console.error("Failed to load doctor directory:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept = selectedDept === 'ALL' || String(doc.department_id) === String(selectedDept);
    const matchesSearch = 
      doc.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.department_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F6F9FB] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F9D8A] bg-teal-50 px-2.5 py-0.5 rounded">
                Hospital Care Team
              </span>
              <span className="text-xs text-slate-400 font-medium">• Consultant Directory</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">My Care Team & Physicians</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse hospital consultants, medical credentials, and book clinical consultations directly.
            </p>
          </div>

          <button
            onClick={() => navigate('/appointments')}
            className="px-4 py-2 bg-[#0F9D8A] hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 self-start sm:self-center"
          >
            <Calendar size={14} />
            <span>Manage Appointments</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by physician name or specialty..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#0F9D8A] transition-colors"
              />
            </div>

            {/* Department Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
              <button
                onClick={() => setSelectedDept('ALL')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                  selectedDept === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Specialties ({doctors.length})
              </button>
              {departments.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDept(String(d.id))}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                    String(selectedDept) === String(d.id)
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-32 h-3.5 bg-slate-200 rounded" />
                    <div className="w-24 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-full h-10 bg-slate-50 rounded" />
              </div>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <UserCheck size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No physicians found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No doctors match your selected specialty or search query. Try choosing another department.
            </p>
            <button
              onClick={() => { setSelectedDept('ALL'); setSearchTerm(''); }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-teal-50 text-[#0F9D8A] font-bold text-sm flex items-center justify-center border border-teal-100">
                        Dr
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{doc.full_name}</h3>
                        <p className="text-xs font-medium text-[#0F9D8A]">{doc.specialization}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {doc.status || 'Active'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Building size={13} className="text-slate-400" />
                      <span>{doc.department_name || 'Hospital Staff'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Award size={13} className="text-slate-400" />
                      <span>{doc.qualification || 'MBBS, MD'} • {doc.experience_years || 5} yrs clinical exp</span>
                    </div>
                    {doc.license_number && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        Reg ID: {doc.license_number}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => navigate('/appointments', { state: { doctorId: doc.id, departmentId: doc.department_id } })}
                    className="flex-1 py-2 bg-[#0F9D8A] hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Calendar size={13} />
                    <span>Book Consultation</span>
                  </button>
                  <button
                    onClick={() => navigate(`/departments`)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    title="View department details"
                  >
                    Department
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;
