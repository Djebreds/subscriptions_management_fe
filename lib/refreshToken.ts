'use server';
import { cookies } from 'next/headers';

export async function refreshToken() {
  const res = await fetch('https://your-external-api.com/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) throw new Error('Token refresh failed');

  cookies().set('access_token', data.accessToken, { httpOnly: true });
  return data.accessToken;
}
