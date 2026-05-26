import api from './api';

export const mlService = {
  /**
   * Predict diabetes based on patient parameters
   * @param {Object} data - { Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age }
   */
  predictDiabetes: (data) => api.post('/predict', data).then(res => res.data),
  
  /**
   * Predict heart disease
   */
  predictHeart: (data) => api.post('/predict/heart', data).then(res => res.data),
  
  /**
   * Predict hypertension
   */
  predictHypertension: (data) => api.post('/predict/hypertension', data).then(res => res.data),
};
