'use client';

import { useEffect, useState } from 'react';

type HealthStatus =
  | { state: 'loading' }
  | { state: 'ok'; timestamp: string }
  | { state: 'error'; message: string };

export default function HealthCheckPage() {
  const [status, setStatus] = useState<HealthStatus>({ state: 'loading' });

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

    fetch(`${apiUrl}/api/health`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as { status: string; timestamp: string };
        setStatus({ state: 'ok', timestamp: data.timestamp });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setStatus({ state: 'error', message });
      });
  }, []);

  return (
    <main
      style={{
        fontFamily: 'monospace',
        padding: '2rem',
        maxWidth: '480px',
        margin: '4rem auto',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        API Health Check
      </h1>

      {status.state === 'loading' && (
        <p style={{ color: '#888' }}>⏳ Checking API…</p>
      )}

      {status.state === 'ok' && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '6px',
            padding: '1rem',
          }}
        >
          <p style={{ color: '#16a34a', fontWeight: 'bold' }}>✅ API is reachable (no CORS error)</p>
          <p style={{ color: '#555', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            status: <strong>ok</strong>
            <br />
            timestamp: {status.timestamp}
            <br />
            api_url: {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}
          </p>
        </div>
      )}

      {status.state === 'error' && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            padding: '1rem',
          }}
        >
          <p style={{ color: '#dc2626', fontWeight: 'bold' }}>❌ Failed to reach API</p>
          <p style={{ color: '#555', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            {status.message}
          </p>
          <p style={{ color: '#888', marginTop: '0.5rem', fontSize: '0.75rem' }}>
            This may be a CORS error, a network issue, or the backend is down.
          </p>
        </div>
      )}
    </main>
  );
}
