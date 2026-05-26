/**
 * mockVitalsService.js
 * Simulates a backend for fetching current patient vitals and historical trends.
 */

export const fetchVitals = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        glucose: {
          value: 104 + Math.floor(Math.random() * 10 - 5),
          unit: 'mg/dL',
          change: 2.4,
          status: 'elevated'
        },
        bloodPressure: {
          systolic: 124 + Math.floor(Math.random() * 8 - 4),
          diastolic: 82 + Math.floor(Math.random() * 6 - 3),
          unit: 'mmHg',
          status: 'elevated'
        },
        heartRate: {
          value: 72 + Math.floor(Math.random() * 10 - 5),
          unit: 'bpm',
          change: -1.2,
          status: 'normal'
        },
        cbcFlags: {
          count: Math.random() > 0.8 ? 1 : 0,
          severity: Math.random() > 0.8 ? 'Warning' : 'Normal'
        }
      });
    }, 800);
  });
};

export const fetchVitalsHistory = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const data = days.map(day => ({
        name: day,
        glucose: 90 + Math.floor(Math.random() * 40),
        systolic: 110 + Math.floor(Math.random() * 30),
        diastolic: 70 + Math.floor(Math.random() * 20),
      }));
      resolve(data);
    }, 600);
  });
};
