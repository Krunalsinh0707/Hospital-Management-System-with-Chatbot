import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CareTeam = ({ doctors = [] }) => {
  const navigate = useNavigate();

  const getDoctorInitials = (name) => {
    if (!name) return 'DR';
    const clean = name.replace(/^Dr\.\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const displayDoctors = doctors.slice(0, 3);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            PEOPLE HELPING YOU
          </p>
          <h2 className="font-editorial text-xl sm:text-2xl font-normal text-slate-900 leading-snug">
            My care team
          </h2>
        </div>
        <Link 
          to="/doctors" 
          className="text-xs font-semibold text-[#0D9488] hover:text-teal-800 transition-colors"
        >
          All doctors
        </Link>
      </div>

      {/* Doctor Items */}
      {displayDoctors && displayDoctors.length > 0 ? (
        <div className="space-y-3">
          {displayDoctors.map((doc) => {
            const initials = getDoctorInitials(doc.full_name);
            const docName = doc.full_name?.startsWith('Dr.') ? doc.full_name : `Dr. ${doc.full_name}`;

            return (
              <div 
                key={doc.id}
                className="flex items-center justify-between gap-3 p-1.5 hover:bg-slate-50/80 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Initials Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[#E8F5F3] text-[#0D9488] flex items-center justify-center font-bold text-xs shrink-0 border border-[#D0ECE7]">
                    {initials}
                  </div>

                  {/* Name and Specialization */}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {docName}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {doc.specialization || doc.department_name || 'Specialist'}
                    </p>
                  </div>
                </div>

                {/* Book Action */}
                <button
                  onClick={() => navigate('/appointments', { state: { doctorId: doc.id, departmentId: doc.department_id } })}
                  className="px-3.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  Book
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-center">
          <p className="text-xs font-medium text-slate-600 mb-1">
            No care team members yet.
          </p>
          <Link
            to="/doctors"
            className="text-xs font-semibold text-[#0D9488] hover:underline"
          >
            Find a doctor
          </Link>
        </div>
      )}
    </div>
  );
};

export default CareTeam;
