import { toast } from 'react-toastify';
import api from '../utils/api';

let user = null;
let isAuthenticated = false;
let userRole = null;
let isFirstLogin = false;

const getToken = () => localStorage.getItem('token');

const checkAuthStatus = async () => {
  try {
    const token = getToken();
    if (!token) {
      clearAuth();
      return false;
    }

    const response = await api.get('/auth/status');
    if (response.data.isAuthenticated) {
      isAuthenticated = true;
      user = response.data.user;
      userRole = response.data.role;
      isFirstLogin = response.data.user.isFirstLogin || false;
      return true;
    } else {
      clearAuth();
      return false;
    }
  } catch (error) {
    console.error('Auth check error:', error);
    clearAuth();
    return false;
  }
};

const login = async (email, password, role = 'teacher') => {
  try {
    const endpoint = role === 'admin' ? '/AdminLogin' : '/auth/login';
    const response = await api.post(endpoint, { email, password });

    const { token, ...userData } = response.data;

    localStorage.setItem('token', token);

    isAuthenticated = true;
    user = userData;
    userRole = role;
    isFirstLogin = userData.isFirstLogin || false;

    toast.success('Login successful!');
    return true;
  } catch (error) {
    console.error('Login error:', error);
    const message = error.response?.data?.message || 'Login failed.';
    toast.error(message);
    return false;
  }
};

const logout = () => {
  localStorage.removeItem('token');
  clearAuth();
  toast.info('Logged out successfully');
};

const clearAuth = () => {
  isAuthenticated = false;
  user = null;
  userRole = null;
  isFirstLogin = false;
};

const updateFirstLoginStatus = (status) => {
  isFirstLogin = status;
  if (user) {
    user.isFirstLogin = status;
  }
};

const updateUserData = (newData) => {
  if (user) {
    user = { ...user, ...newData };
  }
};

export const useAuth = () => ({
  user,
  isAuthenticated,
  userRole,
  isFirstLogin,
  login,
  logout,
  checkAuthStatus,
  updateFirstLoginStatus,
  updateUserData
});
