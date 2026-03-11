import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const customError = new Error(
      error.response?.data?.message || error.message || 'An unexpected error occurred'
    ) as Error & { status?: number };
    
    customError.status = error.response?.status; 
    
    return Promise.reject(customError);
  }
);
