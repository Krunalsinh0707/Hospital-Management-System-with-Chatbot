import api from './api';

export const triggerEmergency = async (emergencyData = {}) => {
  const response = await api.post('/emergency/request', emergencyData);
  return response.data;
};

export const getEmergencyQueue = async () => {
  const response = await api.get('/emergency/queue');
  return response.data;
};

export const updateEmergencyStatus = async (emergencyId, statusData) => {
  const response = await api.put(`/emergency/${emergencyId}/status`, statusData);
  return response.data;
};
