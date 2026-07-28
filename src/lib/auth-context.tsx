import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  name?: string;
  photoURL?: string;
  role?: string;
}

interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<LoginResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  loginAdmin: async () => ({ success: false }),
  signOut: async () => {},
});

const SESSION_KEY = 'trepola_admin_session';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.token && !isTokenExpired(parsed.token)) {
          setUser(parsed.user);
          setToken(parsed.token);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (e) {
      console.error('Error loading stored admin session:', e);
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAdmin = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Correo o contraseña incorrectos.' };
      }

      const newUser: AppUser = {
        uid: 'admin_anwar',
        email: data.user.email,
        displayName: data.user.email.split('@')[0],
        name: data.user.email.split('@')[0],
        role: data.user.role,
      };

      setUser(newUser);
      setToken(data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: newUser, token: data.token }));
      return { success: true };
    } catch (e) {
      return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
