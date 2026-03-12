'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const router = useRouter();

  const { isLoading: loading, data: sessionData } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/auth/session');
        return response.data;
      } catch {
        return { authenticated: false };
      }
    },
    retry: false,
  });

  React.useEffect(() => {
    if (!loading && sessionData?.authenticated && sessionData?.user) {
      setUser(sessionData.user);
    }
  }, [loading, sessionData]);

  const login = React.useCallback(async (token: string, userData: User) => {
    await axios.post('/api/auth/session', { token });
    setUser(userData);
    router.push('/');
  }, [router]);

  const logout = React.useCallback(async () => {
    await axios.delete('/api/auth/session');
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = React.useMemo(() => ({
    user,
    loading,
    login,
    logout,
  }), [user, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
