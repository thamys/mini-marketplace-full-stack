import axios, { AxiosError } from 'axios';

// Direct to backend - public routes
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Via Next.js proxy - authenticated routes
export const bffApi = axios.create({
  baseURL: '/api/proxy',
  headers: {
    'Content-Type': 'application/json',
  },
});

const errorHandler = (error: AxiosError<{ message?: string }>) => {
  const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
  
  if (globalThis.window === undefined) {
    console.error(`[SSR API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${message}`);
  }

  const customError = new Error(message) as Error & { status?: number };
  customError.status = error.response?.status;

  return Promise.reject(customError);
};

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  errorHandler
);

bffApi.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

bffApi.interceptors.response.use(
  (response) => response,
  errorHandler
);
