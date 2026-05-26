import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ReportContext = createContext();

export const useReports = () => useContext(ReportContext);

export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [diabetesRes, heartRes, htnRes, cbcRes] = await Promise.all([
        api.get('/reports/history').catch(() => ({ data: { reports: [] } })),
        api.get('/heart/history').catch(() => ({ data: { reports: [] } })),
        api.get('/hypertension/history').catch(() => ({ data: { reports: [] } })),
        api.get('/cbc/history').catch(() => ({ data: { reports: [] } }))
      ]);

      const safeExtract = (res) => {
        const d = res?.data;
        if (Array.isArray(d)) return d;
        if (d?.reports && Array.isArray(d.reports)) return d.reports;
        return [];
      };

      const merged = [
        ...safeExtract(diabetesRes).map(r => ({ 
          ...r, 
          type: 'diabetes', 
          category: 'Diabetes',
          probability: r.probability || (r.outputs?.ml_model_insights?.probability)
        })),
        ...safeExtract(heartRes).map(r => ({ 
          ...r, 
          type: 'heart', 
          category: 'Cardiovascular',
          probability: r.probability 
        })),
        ...safeExtract(htnRes).map(r => ({ 
          ...r, 
          type: 'hypertension', 
          category: 'Hypertension',
          probability: r.probability 
        })),
        ...safeExtract(cbcRes).map(r => ({ 
          ...r, 
          type: 'cbc', 
          category: 'CBC Analysis',
          probability: r.interpretation?.ml_model_insights?.probability || r.probability
        }))
      ];

      // Sort by latest first
      merged.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      setReports(merged);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Some medical records could not be synchronized.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchAllHistory();
    } else {
      setLoading(false);
      setReports([]);
    }
  }, [fetchAllHistory]);

  const saveReport = async (type, payload) => {
    try {
      let endpoint = '';
      if (type === 'diabetes') endpoint = '/reports/save';
      else if (type === 'heart') endpoint = '/heart/save';
      else if (type === 'hypertension') endpoint = '/hypertension/save';
      else if (type === 'cbc') endpoint = '/cbc/save';
      
      await api.post(endpoint, payload);
      // Wait a tiny bit then refresh to ensure DB sync
      setTimeout(fetchAllHistory, 500);
      return { success: true };
    } catch (err) {
      console.error(`Failed to auto-save ${type} report:`, err);
      return { success: false, error: err };
    }
  };

  return (
    <ReportContext.Provider value={{ reports, loading, error, refreshReports: fetchAllHistory, saveReport }}>
      {children}
    </ReportContext.Provider>
  );
};
