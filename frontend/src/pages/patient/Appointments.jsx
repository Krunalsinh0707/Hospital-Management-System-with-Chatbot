import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Calendar, Clock, User, Hospital, CheckCircle2, AlertCircle } from 'lucide-react';
import { getDepartments, getDepartmentDoctors, bookAppointment, getMyAppointments } from '../../services/hospitalService';

const Appointments = () => {
  const location = useLocation();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoc, setSelectedDoc] = useState('');
  const [appDate, setAppDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [location]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [depts, apps] = await Promise.all([
        getDepartments().catch(() => []),
        getMyAppointments().catch(() => [])
      ]);
      setDepartments(depts || []);
      setAppointments(apps || []);

      // Parse pre-selected department or doctor from state
      const stateDeptId = location.state?.departmentId;
      const stateDeptSlug = location.state?.departmentSlug;
      const stateDocId = location.state?.doctorId;

      let targetDept = null;
      if (depts && depts.length > 0) {
        if (stateDeptId) {
          targetDept = depts.find(d => String(d.id) === String(stateDeptId));
        }
        if (!targetDept && stateDeptSlug) {
          targetDept = depts.find(d => d.slug === stateDeptSlug || d.name.toLowerCase().includes(stateDeptSlug.toLowerCase()));
        }
      }

      if (targetDept) {
        setSelectedDept(String(targetDept.id));
        const docs = await getDepartmentDoctors(targetDept.id).catch(() => []);
        setDoctors(docs || []);
        if (stateDocId && docs.some(d => String(d.id) === String(stateDocId))) {
          setSelectedDoc(String(stateDocId));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptChange = async (deptId) => {
    setSelectedDept(deptId);
    setSelectedDoc('');
    if (!deptId) {
      setDoctors([]);
      return;
    }
    try {
      const docs = await getDepartmentDoctors(deptId);
      setDoctors(docs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc || !appDate) return;

    try {
      await bookAppointment({
        doctor_id: parseInt(selectedDoc),
        department_id: parseInt(selectedDept) || None,
        appointment_date: appDate,
        time_slot: timeSlot,
        reason: reason
      });

      setMessage('Appointment request submitted successfully!');
      setSelectedDept('');
      setSelectedDoc('');
      setAppDate('');
      setReason('');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setMessage('Failed to book appointment. Please try again.');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">DOCTOR CONSULTATIONS & APPOINTMENTS</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Select department, choose available specialist doctor, and request appointment slot.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs rounded-xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-teal-600 font-bold">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Book Appointment Form */}
        <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Calendar size={18} className="text-[#0F9D8A]" /> Book New Appointment
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">1. Select Department</label>
              <select
                value={selectedDept}
                onChange={(e) => handleDeptChange(e.target.value)}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0F9D8A]"
              >
                <option value="">-- Choose Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">2. Select Specialist Doctor</label>
              <select
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                disabled={!selectedDept || doctors.length === 0}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0F9D8A] disabled:opacity-50"
              >
                <option value="">{doctors.length === 0 ? '-- Select Department First --' : '-- Choose Doctor --'}</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.full_name} ({doc.specialization})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">3. Appointment Date</label>
              <input
                type="date"
                value={appDate}
                onChange={(e) => setAppDate(e.target.value)}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">4. Time Slot</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0F9D8A]"
              >
                <option value="09:00 AM">09:00 AM - Morning</option>
                <option value="10:30 AM">10:30 AM - Morning</option>
                <option value="02:00 PM">02:00 PM - Afternoon</option>
                <option value="04:30 PM">04:30 PM - Evening</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Reason for Visit</label>
              <textarea
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe symptoms or routine checkup..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#0F9D8A] hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-600/20"
            >
              Request Appointment
            </button>
          </form>
        </div>

        {/* Right Column: Appointment History List */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">My Appointments</h2>

          {loading ? (
            <p className="text-xs text-slate-400 py-8 text-center">Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar size={40} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold">No appointment requests found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((app) => (
                <div key={app.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F9D8A]">{app.department_name}</span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">📅 {app.appointment_date} ({app.time_slot})</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">{app.doctor_name} <span className="text-xs font-normal text-slate-500">({app.specialization})</span></h3>
                    {app.reason && <p className="text-xs text-slate-600">Reason: {app.reason}</p>}
                  </div>

                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase self-start md:self-center ${
                    app.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                    app.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
