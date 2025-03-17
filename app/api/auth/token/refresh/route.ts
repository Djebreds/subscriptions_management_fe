import { getTokenServer } from '@/lib/token-server';
import { NextRequest, NextResponse } from 'next/server';

interface RefreshResponse {
  access: string;
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await getTokenServer();

    if (!refreshToken && !accessToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/token/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      }
    );

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: 'Token refresh failed' },
        { status: apiRes.status }
      );
    }

    const data: RefreshResponse = await apiRes.json();

    return NextResponse.json({ accessToken: data.access });
  } catch (error) {
    let errorMessage = 'Something went wrong.';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
