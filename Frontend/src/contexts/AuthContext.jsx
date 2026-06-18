import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

function parseStoredUser() {
  try {
    const raw = localStorage.getItem('tempus_usuario');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(parseStoredUser);

  const login = useCallback(async (email, senha) => {
    const data = await api.login(email, senha);

    // Normalise: accept both `role` (new) and `perfil` (legacy) from the API
    const user = {
      ...data.usuario,
      role:   data.usuario.role   || data.usuario.perfil,
      perfil: data.usuario.perfil || data.usuario.role,
    };

    localStorage.setItem('tempus_token',   data.token);
    localStorage.setItem('tempus_usuario', JSON.stringify(user));
    setUsuario(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tempus_token');
    localStorage.removeItem('tempus_usuario');
    setUsuario(null);
  }, []);

  // RBAC helpers — role hierarchy: administrador > contador > auxiliar
  const role     = usuario?.role || usuario?.perfil || '';
  const isAdmin  = role === 'administrador';
  const isContador = role === 'contador' || isAdmin;

  return (
    <AuthContext.Provider value={{ usuario, login, logout, role, isAdmin, isContador }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
