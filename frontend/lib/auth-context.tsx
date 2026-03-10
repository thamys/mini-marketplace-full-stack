'use client';

import React, { createContext, useContext, useState } from 'react';
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



import { useQuery } from '@tanstack/react-query';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const { isLoading: loading } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/auth/session');
        if (response.data.authenticated && response.data.token) {
          const decoded = jwtDecode<{ sub: string; email: string; role: string }>(response.data.token);
          const userData = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
          };
          setUser(userData);
          return userData;
        }
      } catch {
        setUser(null);
        return null;
      }
      setUser(null);
      return null;
    },
    staleTime: Infinity, // The session is only checked on mount or explicit invalidate
    retry: false,
  });



  const login = React.useCallback(async (token: string) => {
    await axios.post('/api/auth/session', { token });
    const decoded = jwtDecode<{ sub: string; email: string; role: string }>(token);
    setUser({
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    });
    router.push('/');
  }, [router]);

  const logout = React.useCallback(async () => {
    await axios.delete('/api/auth/session');
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = React.useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

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
