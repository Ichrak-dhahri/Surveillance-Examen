import { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Check if user is authenticated
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      // Check token validity with backend
      const response = await api.get('/api/auth/status');
      
      if (response.data.isAuthenticated) {
        setIsAuthenticated(true);
        setUser(response.data.user);
        setUserRole(response.data.role);
        setIsFirstLogin(response.data.user.isFirstLogin || false);
      } else {
        // Token is invalid or expired
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login user (teacher or admin)
  const login = async (email, password, role = 'teacher') => {
    try {
      setIsLoading(true);
      
      const endpoint = role === 'admin' ? '/api/admin/login' : '/api/auth/login';
      const response = await api.post(endpoint, { email, password });
      
      const { token, ...userData } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Update state
      setIsAuthenticated(true);
      setUser(userData);
      setUserRole(role);
      
      if (role === 'teacher') {
        setIsFirstLogin(userData.isFirstLogin || false);
      }
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setUserRole(null);
    setIsFirstLogin(false);
    toast.info('Logged out successfully');
  };

  // Update first login status
  const updateFirstLoginStatus = (status) => {
    setIsFirstLogin(status);
    
    if (user) {
      setUser({
        ...user,
        isFirstLogin: status
      });
    }
  };

  // Update user data
  const updateUserData = (newData) => {
    setUser({
      ...user,
      ...newData
    });
  };

  const value = {
    isAuthenticated,
    user,
    userRole,
    isLoading,
    isFirstLogin,
    login,
    logout,
    checkAuthStatus,
    updateFirstLoginStatus,
    updateUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};