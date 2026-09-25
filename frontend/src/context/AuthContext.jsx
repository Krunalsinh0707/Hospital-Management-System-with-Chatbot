import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/users/me')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password, expectedPortal = null) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    try {
      const response = await api.post('/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      if (response.data.access_token) {
        const token = response.data.access_token;
        localStorage.setItem('token', token);
        
        // Fetch user profile with the newly acquired token
        const userRes = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = userRes.data;
        const role = (userData.role || '').toLowerCase();

        // Portal-specific role validation
        if (expectedPortal) {
          const isPatient = role === 'patient' || role === 'user';
          const isDoctor = role === 'doctor' || role === 'emergency_doctor';
          const isAdmin = role === 'admin' || role === 'hospital_admin' || role === 'department_admin';

          if (expectedPortal === 'patient') {
            if (isDoctor) {
              localStorage.removeItem('token');
              setUser(null);
              const err = new Error("Access denied. This account is registered for the Doctor Portal. Please use Doctor Login.");
              err.code = "WRONG_PORTAL";
              err.portal = "doctor";
              throw err;
            }
            if (isAdmin) {
              localStorage.removeItem('token');
              setUser(null);
              const err = new Error("Access denied. Please use the Administration Portal.");
              err.code = "WRONG_PORTAL";
              err.portal = "admin";
              throw err;
            }
            if (!isPatient) {
              localStorage.removeItem('token');
              setUser(null);
              const err = new Error("These credentials are not registered for the patient portal.");
              err.code = "WRONG_PORTAL";
              throw err;
            }
          } else if (expectedPortal === 'doctor') {
            if (isPatient) {
              localStorage.removeItem('token');
              setUser(null);
              const err = new Error("Access denied. This account is registered for the Patient Portal. Please use Patient Login.");
              err.code = "WRONG_PORTAL";
              err.portal = "patient";
              throw err;
            }
            if (isAdmin) {
              localStorage.removeItem('token');
              setUser(null);
              const err = new Error("Access denied. This account does not have clinical doctor privileges. Please use Admin Login.");
              err.code = "WRONG_PORTAL";
              err.portal = "admin";
              throw err;
            }
            if (!isDoctor) {
              localStorage.removeItem('token');
              setUser(null);
              const err = new Error("Access denied. Doctor authorization required.");
              err.code = "WRONG_PORTAL";
              throw err;
            }
          } else if (expectedPortal === 'admin') {
            if (!isAdmin) {
              localStorage.removeItem('token');
              setUser(null);
              const err = new Error("Access denied. This account does not have administrator privileges.");
              err.code = "WRONG_PORTAL";
              err.portal = isDoctor ? "doctor" : "patient";
              throw err;
            }
          }
        }

        setUser(userData);
        return userData;
      }
      return null;
    } catch (err) {
      console.error('Login failed', err);
      throw err;
    }
  };

  const register = async (fullName, email, mobileNo, bloodGroup, password) => {
    try {
      const response = await api.post('/register', {
        full_name: fullName,
        email: email,
        mobile_no: mobileNo,
        blood_group: bloodGroup,
        password: password
      });
      return response.status === 201 || response.status === 200;
    } catch (err) {
      console.error('Registration failed', err);
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      return null;
    }
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const logout = (portalHint) => {
    let target = '/patient/login';
    const role = (user?.role || '').toLowerCase();
    
    if (portalHint) {
      target = portalHint;
    } else if (role === 'doctor' || role === 'emergency_doctor' || window.location.pathname.startsWith('/doctor')) {
      target = '/doctor/login';
    } else if (role === 'admin' || role === 'hospital_admin' || role === 'department_admin' || window.location.pathname.startsWith('/admin')) {
      target = '/admin/login';
    }
    
    localStorage.removeItem('token');
    setUser(null);
    window.location.replace(target);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
