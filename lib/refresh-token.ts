import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function refreshAccessToken(
  request: NextRequest,
  refreshToken: string | undefined
): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    const refreshRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/token/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      }
    );

    if (!refreshRes.ok) {
      return null;
    }

    const data = await refreshRes.json();

    cookieStore.set('accessToken', data.access);
    cookieStore.set('refreshToken', data.refresh);

    return data.accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}
