import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (api.isAuthenticated()) {
      api.getMe()
        .then(u => {
          setUser(u);
          localStorage.setItem('mimis_user', JSON.stringify(u));
        })
        .catch(() => {
          api.logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    localStorage.setItem('mimis_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (username, email, password, display_name) => {
    const data = await api.register(username, email, password, display_name);
    setUser(data.user);
    localStorage.setItem('mimis_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}