import { cookies } from 'next/headers';

export async function getTokenServer() {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  return { accessToken, refreshToken };
}

export async function setTokenServer(
  accessToken: string,
  refreshToken: string
) {
  const cookieStore = await cookies();

  cookieStore.set('accessToken', accessToken);
  cookieStore.set('refreshToken', refreshToken);
}

export async function deleteTokenServer() {
  const cookieStore = await cookies();

  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}
