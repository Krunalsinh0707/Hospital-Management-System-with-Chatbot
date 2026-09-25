import api from './api';

export const getMyReports = async () => {
  const response = await api.get('/medical-reports/my');
  return response.data;
};

export const uploadReportFile = async (file, reportTitle = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (reportTitle) formData.append('report_title', reportTitle);

  const response = await api.post('/medical-reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const createHospitalReport = async (reportData) => {
  const response = await api.post('/medical-reports/hospital', reportData);
  return response.data;
};

export const getReportsPendingReview = async () => {
  const response = await api.get('/medical-reports/doctor/queue');
  return response.data;
};

export const submitDoctorReview = async (reportId, reviewData) => {
  const response = await api.post(`/medical-reports/${reportId}/review`, reviewData);
  return response.data;
};

export const getPatientReports = async (patientId) => {
  const response = await api.get(`/medical-reports/patient/${patientId}`);
  return response.data;
};

