import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Plus, Clock } from 'lucide-react';

const UpcomingAppointments = ({ appointments = [], onCancelAppointment }) => {
  const navigate = useNavigate();

  // Helper to extract month and day for the square badge
  const parseDateBadge = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return { month: 'DATE', day: '--' };
      }
      const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const day = d.getDate();
      return { month, day };
    } catch {
      return { month: 'APT', day: '•' };
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            YOUR SCHEDULE
          </p>
          <h2 className="font-editorial text-xl sm:text-2xl font-normal text-slate-900 leading-snug">
            Upcoming appointments
          </h2>
        </div>
        <Link 
          to="/appointments" 
          className="text-xs font-semibold text-[#0D9488] hover:text-teal-800 transition-colors"
        >
          Manage
        </Link>
      </div>

      {/* Appointment Items */}
      {appointments && appointments.length > 0 ? (
        <div className="space-y-3.5 mb-5">
          {appointments.slice(0, 3).map((apt) => {
            const { month, day } = parseDateBadge(apt.appointment_date);
            const statusUpper = (apt.status || 'CONFIRMED').toUpperCase();
            const isConfirmed = statusUpper === 'CONFIRMED';
            const isRequested = statusUpper === 'REQUESTED';

            return (
              <div 
                key={apt.id} 
                className="flex items-center justify-between gap-3 p-2 hover:bg-slate-50/80 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Square Date Badge */}
                  <div className="w-11 h-11 rounded-xl bg-[#E8F5F3] text-[#0D9488] flex flex-col items-center justify-center font-bold shrink-0 border border-[#D0ECE7]">
                    <span className="text-[9px] uppercase tracking-wider leading-none">{month}</span>
                    <span className="text-base font-bold leading-none mt-0.5">{day}</span>
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {apt.doctor_name ? (apt.doctor_name.startsWith('Dr.') ? apt.doctor_name : `Dr. ${apt.doctor_name}`) : 'Hospital Specialist'}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {apt.department_name ? `${apt.department_name} consultation` : 'Clinical consultation'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <Clock size={11} className="text-slate-400" />
                      <span>{apt.time_slot || '10:00 AM'}</span>
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0 text-right">
                  <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md border ${
                    isConfirmed 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : isRequested 
                      ? 'bg-[#E8F5F3] text-[#0D9488] border-[#D0ECE7]' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {statusUpper}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-center mb-5">
          <p className="text-xs font-medium text-slate-600 mb-1">
            No upcoming appointments
          </p>
          <p className="text-[11px] text-slate-400">
            Schedule a consultation with our hospital physicians.
          </p>
        </div>
      )}

      {/* Book Appointment Button */}
      <button
        onClick={() => navigate('/appointments')}
        className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Calendar size={14} className="text-[#0D9488]" />
        <span>Book appointment</span>
      </button>
    </div>
  );
};

export default UpcomingAppointments;
