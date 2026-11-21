import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, onUnauthorized, tokenStore } from '../services/api';

const AuthContext = createContext(null);

// Shared-PIN access. The PIN is checked on the server; the browser only keeps
// the signed token it receives back.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
  }, []);

  useEffect(() => {
    onUnauthorized(logout);
  }, [logout]);

  const login = useCallback(async (pin) => {
    const { token: newToken } = await authApi.login(pin);
    tokenStore.set(newToken);
    setToken(newToken);
  }, []);

  const value = useMemo(() => ({ isLoggedIn: Boolean(token), login, logout }), [token, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
