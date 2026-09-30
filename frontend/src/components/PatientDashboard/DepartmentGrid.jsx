import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, ChevronRight } from 'lucide-react';

const DepartmentGrid = ({ departments = [] }) => {
  const navigate = useNavigate();

  // Load up to 6 real departments
  const displayDepts = departments.slice(0, 6);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs mb-6">
      {/* Header */}
      <div className="mb-3.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          FIND A SPECIALIST
        </p>
        <h3 className="font-editorial text-xl font-normal text-slate-900 leading-snug">
          Hospital departments
        </h3>
      </div>

      {/* 2-Column Compact Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {displayDepts.length > 0 ? (
          displayDepts.map(dept => {
            const slug = dept.slug || dept.name.toLowerCase().replace(/\s+/g, '-');
            return (
              <div
                key={dept.id}
                onClick={() => navigate(`/departments/${slug}`)}
                className="p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-[#F0FDFA]/40 transition-all cursor-pointer group flex flex-col justify-between min-h-[64px]"
              >
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0D9488] transition-colors leading-tight">
                  {dept.name}
                </h4>
                <div className="flex items-center gap-0.5 text-[11px] font-medium text-[#0D9488] mt-1">
                  <span>View specialty</span>
                  <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 p-4 text-center text-xs text-slate-400">
            Loading departments...
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentGrid;
