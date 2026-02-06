import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:3002/api/auth/login', {
        email,
        password,
      });
      
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.msg || 'Login failed. Please try again.',
      };
    }
  };

  const createUser = async (name, email, password, role) => {
    try {
      const response = await axios.post('http://localhost:3002/api/auth/users', {
        name,
        email,
        password,
        role: role || 'employee',
      });
      return { success: true, user: response.data.user };
    } catch (error) {
      const msg = error.response?.data?.msg
        || error.response?.data?.error
        || (error.response?.status === 403 && 'Access denied. Admin only.')
        || (error.response?.status === 401 && 'Please log in again.')
        || error.message
        || 'Failed to create user.';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isEmployee = () => {
    return user?.role === 'employee';
  };

  const value = {
    user,
    token,
    loading,
    login,
    createUser,
    logout,
    isAdmin,
    isEmployee,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
