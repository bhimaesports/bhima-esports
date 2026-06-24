import { createContext, useContext, useState, useCallback } from 'react';
import api, { setToken, clearToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setTokenState] = useState(null);
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState('');

  const login = useCallback(async (username, password) => {
    try {
      setLoginError('');
      const data = await api.post('/auth/login', { admin_id: username, password });
      const tk = data.token;
      setToken(tk);
      setTokenState(tk);
      setIsAdmin(true);
      setAdminLoginModalOpen(false);
      return true;
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
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
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
