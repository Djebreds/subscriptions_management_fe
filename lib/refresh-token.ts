import { cookies } from 'next/headers';

export async function refreshAccessToken(refreshToken: string) {
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
      return undefined;
    }

    const data = await refreshRes.json();

    cookieStore.set('accessToken', data.access);
    cookieStore.set('refreshToken', data.refresh);

    return {
      accessToken: data.accessToken as string,
      refreshToken: data.refreshToken as string,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return undefined;
  }
}
