import { refreshAccessToken } from '@/lib/refresh-token';
import { getTokenServer } from '@/lib/token-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { accessToken, refreshToken } = await getTokenServer();

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!apiRes.ok && apiRes.status === 401) {
      await refreshAccessToken(refreshToken);
    }

    const user = await apiRes.json();

    return NextResponse.json({ user });
  } catch (error: unknown) {
    let errorMessage = 'Something went wrong';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
