import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  demoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('futlens_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('futlens_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('futlens_token', newToken);
    localStorage.setItem('futlens_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('futlens_token');
    localStorage.removeItem('futlens_user');
  };

  const demoLogin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@futlens.ai', password: 'password123' })
      });
      if (res.ok) {
        const data = await res.json();
        login(data.token, data.user);
      }
    } catch (err) {
      console.error("Demo login error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: Boolean(token), login, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
