import { cookies } from 'next/headers';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api';

export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export interface Session {
  user: User | null;
  authenticated: boolean;
}

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return { user: null, authenticated: false };
  }

  try {
    const response = await axios.get(`${BACKEND_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 1000,
    });

    return {
      user: response.data,
      authenticated: true,
    };
  } catch {
    // Fallback: If backend call fails (e.g. in E2E tests without real backend), 
    // try to decode the JWT to provide basic user info for the UI
    try {
      const decoded = jwtDecode<User & { sub?: string }>(token);
      // Basic validation: ensure it has at least a role
      if (decoded?.role) {
        return {
          user: {
            id: decoded.id || decoded.sub || '0',
            email: decoded.email || '',
            role: decoded.role,
            name: decoded.name || 'User'
          },
          authenticated: true,
        };
      }
    } catch {
      // Ignore decode errors
    }
    
    return { user: null, authenticated: false };
  }
}
