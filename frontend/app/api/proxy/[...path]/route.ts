import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api';
const PROXY_TIMEOUT_MS = process.env.PROXY_TIMEOUT_MS ? Number(process.env.PROXY_TIMEOUT_MS) : 10000;

async function handleProxyRequest(
  request: NextRequest,
  method: string
) {
  try {
    const { pathname, search } = request.nextUrl;
    const path = pathname.replace('/api/proxy/', '');
    const url = `${BACKEND_URL}/${path}${search}`;

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let body = null;
    if (method !== 'GET' && method !== 'DELETE') {
      body = await request.json().catch(() => null);
    }

    const config = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(body && { data: body }),
      validateStatus: () => true,
      timeout: PROXY_TIMEOUT_MS,
    };

    const response = await axios(config);

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      console.error('Proxy timeout:', error.message);
      return NextResponse.json(
        { message: 'Gateway Timeout: the backend did not respond in time.' },
        { status: 504 }
      );
    }
    const axiosError = error as { message: string };
    console.error('Proxy error:', axiosError.message);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleProxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleProxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleProxyRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return handleProxyRequest(request, 'DELETE');
}