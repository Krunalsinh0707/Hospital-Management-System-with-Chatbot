import api from './api';

export const dashboardService = {
  getDiabetesHistory: () => api.get('/reports/history').then(res => res.data),
  getHeartHistory: () => api.get('/heart/history').then(res => res.data),
  getHypertensionHistory: () => api.get('/hypertension/history').then(res => res.data),
  getCbcHistory: () => api.get('/cbc/history').then(res => res.data),
  trainCustomML: (formData) => api.post('/ml/train-custom', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
};
