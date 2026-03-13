import { cookies } from 'next/headers';
import axios from 'axios';

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
    // Backend unreachable or token invalid — treat as unauthenticated.
    // NOTE: We intentionally do NOT fall back to jwtDecode here because
    // jwt-decode does not verify the token signature, which would allow a
    // forged token to bypass frontend route gating (e.g. faking ADMIN role).
    return { user: null, authenticated: false };
  }
}
