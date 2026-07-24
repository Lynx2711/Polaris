import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await authService.me();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    if (data && data.token) {
      localStorage.setItem('token', data.token);
    }
    setUser(data.user || data);
    return data;
  };

  const loginWithGoogle = async (credential) => {
    const data = await authService.googleLogin(credential);
    if (data && data.token) {
      localStorage.setItem('token', data.token);
    }
    setUser(data.user || data);
    return data;
  };

  const signup = async (fullName, email, password) => {
    return await authService.register({ fullName, email, password });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (fullName, email) => {
    const updated = await authService.updateProfile({ fullName, email });
    setUser(updated);
    return updated;
  };

  const changePassword = async (currentPassword, newPassword) => {
    return await authService.changePassword({ currentPassword, newPassword });
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    signup,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
