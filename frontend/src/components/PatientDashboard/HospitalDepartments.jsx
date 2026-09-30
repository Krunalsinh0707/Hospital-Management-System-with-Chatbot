import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const HospitalDepartments = ({ departments = [] }) => {
  const navigate = useNavigate();

  // Standard departments fallback if backend returns fewer than 6
  const displayDepartments = React.useMemo(() => {
    if (departments && departments.length >= 6) {
      return departments.slice(0, 6);
    }
    const defaultDepts = [
      { name: 'Cardiology', slug: 'cardiology' },
      { name: 'Oncology', slug: 'oncology' },
      { name: 'Orthopedics', slug: 'orthopedics' },
      { name: 'Neurology', slug: 'neurology' },
      { name: 'Pulmonology', slug: 'pulmonology' },
      { name: 'Endocrinology', slug: 'endocrinology' },
    ];
    if (!departments || departments.length === 0) return defaultDepts;
    const merged = [...departments];
    for (const d of defaultDepts) {
      if (merged.length >= 6) break;
      if (!merged.some(m => m.name.toLowerCase() === d.name.toLowerCase())) {
        merged.push(d);
      }
    }
    return merged.slice(0, 6);
  }, [departments]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs mb-6">
      {/* Header */}
      <div className="mb-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          FIND A SPECIALIST
        </p>
        <h2 className="font-editorial text-xl sm:text-2xl font-normal text-slate-900 leading-snug">
          Hospital departments
        </h2>
      </div>

      {/* 2-Column Compact Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {displayDepartments.map((dept, idx) => {
          const slug = dept.slug || dept.name.toLowerCase().replace(/\s+/g, '-');
          return (
            <div
              key={dept.id || idx}
              onClick={() => navigate(`/departments/${slug}`)}
              className="p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-[#F0FDFA]/40 transition-all cursor-pointer group"
            >
              <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#0D9488] transition-colors">
                {dept.name}
              </h4>
              <p className="text-[10px] font-medium text-[#0D9488] flex items-center gap-0.5 mt-1">
                <span>View specialty</span>
                <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HospitalDepartments;
