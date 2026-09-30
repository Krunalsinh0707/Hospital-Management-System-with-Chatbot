import React from 'react';

const RecentActivity = ({ activities = [] }) => {
  // Fallback defaults only if patient has zero activity in their account history
  const displayActivities = activities && activities.length > 0 ? activities : [
    { date: 'Recent', title: 'Clinical telemetry synchronized', sub: 'Vital readings recorded and updated' }
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
      {/* Header */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          CLINICAL LOG
        </p>
        <h2 className="font-editorial text-2xl sm:text-[26px] font-normal text-slate-900 leading-snug">
          Recent activity
        </h2>
      </div>

      {/* Activity Timeline List */}
      <div className="divide-y divide-slate-100">
        {displayActivities.slice(0, 5).map((act, idx) => (
          <div key={idx} className="py-3 first:pt-0 flex items-start gap-4">
            {/* Date Tag */}
            <div className="w-16 shrink-0">
              <span className="text-xs font-bold text-slate-700">
                {act.date}
              </span>
            </div>

            {/* Description */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {act.title}
              </h4>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-relaxed">
                {act.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
