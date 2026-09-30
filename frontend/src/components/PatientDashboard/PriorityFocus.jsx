import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, ShieldCheck, Calendar, ArrowRight, 
  MessageSquare, ChevronRight, Clock, Plus
} from 'lucide-react';

const PriorityFocus = ({ 
  alertData, 
  nextAppointment, 
  onViewAppointmentDetails,
  onOpenConsultation 
}) => {
  const navigate = useNavigate();

  // Helper to format appointment date & time
  const formatAppointmentTime = (app) => {
    if (!app) return { dateStr: '', timeStr: '' };
    try {
      const d = new Date(app.appointment_date);
      const isToday = new Date().toDateString() === d.toDateString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = tomorrow.toDateString() === d.toDateString();

      let prefix = '';
      if (isToday) prefix = 'Today, ';
      else if (isTomorrow) prefix = 'Tomorrow, ';

      const dateStr = `${prefix}${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
      const timeStr = app.time_slot || d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { dateStr, timeStr };
    } catch {
      return { dateStr: app.appointment_date || 'Upcoming', timeStr: app.time_slot || '' };
    }
  };

  const appTime = formatAppointmentTime(nextAppointment);

  return (
    <section className="mb-10">
      {/* Section Eyebrow & Title */}
      <div className="mb-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          PRIORITY FOCUS
        </p>
        <h2 className="font-editorial text-2xl sm:text-[26px] font-normal text-slate-900 leading-snug">
          Your next best actions
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── LEFT CARD: Health Alert / Attention Card ── */}
        {alertData?.hasAlert ? (
          <div className="bg-[#FEF2F2] border border-[#FCA5A5]/70 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs">
            <div>
              <div className="flex items-start gap-3.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-100/90 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {alertData.title}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white rounded-full">
                      {alertData.actionPill || 'ACT NOW'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal">
                    {alertData.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-red-200/60 mt-3 flex-wrap">
              {alertData.actionLink ? (
                <Link
                  to={alertData.actionLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                >
                  <span>Review risk details</span>
                  <ChevronRight size={14} />
                </Link>
              ) : (
                <button
                  onClick={() => navigate('/analytics')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                >
                  <span>Review risk details</span>
                  <ChevronRight size={14} />
                </button>
              )}

              <button
                onClick={onOpenConsultation || (() => navigate('/patient/chat'))}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
              >
                <MessageSquare size={13} className="text-slate-500" />
                <span>Contact care team</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs">
            <div>
              <div className="flex items-start gap-3.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0D9488] flex items-center justify-center shrink-0 border border-emerald-200">
                  <ShieldCheck size={22} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      No urgent health actions
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                      ALL STABLE
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                    All your recent clinical vitals, laboratory tests, and risk assessments are within acceptable reference ranges. Continue standard care routine.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-emerald-200/60 mt-3">
              <Link
                to="/analytics"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
              >
                <span>View health analytics</span>
                <ChevronRight size={14} />
              </Link>
              <Link
                to="/reports"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shadow-2xs"
              >
                <span>Medical reports</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── RIGHT CARD: Next Appointment ── */}
        <div className="bg-[#0E5B55] text-white rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-sm">
          {/* Subtle background ambient element */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

          {nextAppointment ? (
            <>
              <div>
                <p className="text-[10px] font-bold text-teal-200 uppercase tracking-widest mb-1.5">
                  NEXT APPOINTMENT
                </p>
                <h3 className="font-editorial text-xl sm:text-2xl font-normal text-white leading-snug mb-3">
                  {nextAppointment.department_name || 'Consultation'} with Dr. {nextAppointment.doctor_name || 'Specialist'}
                </h3>
                <p className="text-xs sm:text-[13px] text-teal-100 font-normal leading-relaxed">
                  {appTime.dateStr} - {appTime.timeStr}
                </p>
                <p className="text-xs text-teal-200/80 font-medium mt-0.5">
                  {nextAppointment.department_name ? `${nextAppointment.department_name} department` : 'Outpatient Clinical Clinic'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-teal-600/60 mt-4 flex-wrap gap-2">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-teal-800/80 text-teal-200 rounded-full border border-teal-600/40">
                  {nextAppointment.status || 'CONFIRMED'}
                </span>

                <button
                  onClick={() => {
                    if (onViewAppointmentDetails) onViewAppointmentDetails(nextAppointment);
                    else navigate('/appointments');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-teal-50 text-[#0E5B55] text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <Calendar size={13} />
                  <span>View details</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-bold text-teal-200 uppercase tracking-widest mb-1.5">
                  NEXT APPOINTMENT
                </p>
                <h3 className="font-editorial text-xl sm:text-2xl font-normal text-white leading-snug mb-2">
                  No upcoming appointments
                </h3>
                <p className="text-xs sm:text-[13px] text-teal-100 font-normal leading-relaxed">
                  You do not have any scheduled consultations. Schedule your next routine checkup or specialist visit anytime.
                </p>
              </div>

              <div className="pt-4 border-t border-teal-600/60 mt-4 flex justify-end">
                <Link
                  to="/appointments"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-teal-50 text-[#0E5B55] text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <Plus size={14} />
                  <span>Book appointment</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default PriorityFocus;
