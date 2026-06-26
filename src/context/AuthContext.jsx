import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { setToken, clearToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setTokenState] = useState(null);
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Restore session from localStorage on load
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setTokenState(savedToken);
      setIsAdmin(true);
      setToken(savedToken);
    }
    setIsInitializing(false);
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      setLoginError('');
      const data = await api.post('/auth/login', { admin_id: username, password });
      const tk = data.token;
      if (!tk) {
        setLoginError('No token received from server');
        return false;
      }
      localStorage.setItem('adminToken', tk);
      setToken(tk);
      setTokenState(tk);
      setIsAdmin(true);
      setAdminLoginModalOpen(false);
      return true;
    } catch (err) {
      const msg = err.message || 'Invalid credentials';
      setLoginError(msg);
      console.error('Login failed:', msg);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    clearToken();
    setTokenState(null);
    setIsAdmin(false);
  }, []);

  const openAdminLogin = useCallback(() => setAdminLoginModalOpen(true), []);
  const closeAdminLogin = useCallback(() => {
    setAdminLoginModalOpen(false);
    setLoginError('');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        token,
        login,
        logout,
        loginError,
        adminLoginModalOpen,
        openAdminLogin,
        closeAdminLogin,
      }}
    >
      {!isInitializing && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
