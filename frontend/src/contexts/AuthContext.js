import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const decodeAndSetUser = (token) => {
    try {
      const decoded = jwtDecode(token);
      setUser({
        id: decoded.sub,
        role: decoded.role,
        full_name: decoded.full_name || '',
        email: decoded.email || '',
      });
    } catch (e) {
      localStorage.removeItem('access_token');
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      decodeAndSetUser(token);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    decodeAndSetUser(access_token);
  };

  const register = async (email, password, fullName, role) => {
    await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
      role
    });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
