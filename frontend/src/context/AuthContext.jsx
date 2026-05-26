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

  const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    try {
      const response = await api.post('/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        const userRes = await api.get('/users/me');
        setUser(userRes.data);
        return true;
      }
      return false;
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

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
