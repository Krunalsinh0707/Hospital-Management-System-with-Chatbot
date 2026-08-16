import api from './api';

export const getAIModels = async () => {
  const response = await api.get('/ai/models');
  return response.data;
};

export const getAIModelDetail = async (modelSlug) => {
  const response = await api.get(`/ai/models/${modelSlug}`);
  return response.data;
};

export const getModelSchema = async (modelSlug) => {
  const response = await api.get(`/ai/models/${modelSlug}/schema`);
  return response.data;
};

export const getDepartmentsWithModels = async () => {
  const response = await api.get('/ai/departments');
  return response.data;
};

export const runAIAnalysis = async (modelSlug, parameters) => {
  const response = await api.post('/ai/analyze', {
    model_slug: modelSlug,
    parameters: parameters
  });
  return response.data;
};
