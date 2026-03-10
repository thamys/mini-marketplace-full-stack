'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const restoreSession = async () => {
    try {
      const response = await axios.get('/api/auth/session');
      if (response.data.authenticated && response.data.token) {
        try {
          const decoded = jwtDecode<{ sub: string; email: string; role: string }>(response.data.token);
          setUser({
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
          });
        } catch (decodeError) {
          console.error('Invalid token found in session:', decodeError);
          await axios.delete('/api/auth/session');
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);



  const login = async (token: string) => {
    await axios.post('/api/auth/session', { token });
    const decoded = jwtDecode<{ sub: string; email: string; role: string }>(token);
    setUser({
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    });
    router.push('/');
  };

  const logout = React.useCallback(async () => {
    await axios.delete('/api/auth/session');
    setUser(null);
    router.push('/login');
  }, [router]);

  const stableLogin = React.useCallback(login, [router]);

  const value = React.useMemo(() => ({ user, loading, login: stableLogin, logout }), [user, loading, stableLogin, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
