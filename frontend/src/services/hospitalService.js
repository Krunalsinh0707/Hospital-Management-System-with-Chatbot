import api from './api';

export const getDepartments = async () => {
  const response = await api.get('/departments');
  return response.data;
};

export const getDepartmentDetails = async (deptIdOrSlug) => {
  const response = await api.get(`/departments/${deptIdOrSlug}`);
  return response.data;
};

export const getDepartmentDoctors = async (deptId) => {
  const response = await api.get(`/departments/${deptId}/doctors`);
  return response.data;
};

export const getAllDoctors = async (departmentId = null) => {
  const url = departmentId ? `/doctors?department_id=${departmentId}` : '/doctors';
  const response = await api.get(url);
  return response.data;
};

export const createDoctor = async (doctorData) => {
  const response = await api.post('/doctors', doctorData);
  return response.data;
};

export const getDoctorProfile = async () => {
  const response = await api.get('/doctors/me');
  return response.data;
};

export const bookAppointment = async (appointmentData) => {
  const response = await api.post('/appointments', appointmentData);
  return response.data;
};

export const getMyAppointments = async () => {
  const response = await api.get('/appointments/my');
  return response.data;
};

export const getDoctorAppointments = async () => {
  const response = await api.get('/appointments/doctor');
  return response.data;
};

export const updateAppointmentStatus = async (id, status, notes = '') => {
  const response = await api.put(`/appointments/${id}/status`, { status, notes });
  return response.data;
};
