import api from './api';

export async function login(username: string, password: string) {
  const res = await api.post('auth/login', { username, password });

  console.log(res);

  const { access, refresh, user } = res.data;

  localStorage.setItem('access', access);
  localStorage.setItem('refresh', refresh);

  return user;
}

export async function register(
  firstName: string,
  lastName: string,
  username: string,
  password: string
) {
  const res = await api.post('auth/register', {
    firstName,
    lastName,
    username,
    password,
  });

  return res.data;
}

export async function registerAndLogin(
  firstName: string,
  lastName: string,
  username: string,
  password: string
) {
  await register(firstName, lastName, username, password);

  return await login(username, password);
}

export async function refreshToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh');

  if (!refreshToken) throw new Error('No refresh token available');

  const res = await api.post('auth/token/refresh', { refresh: refreshToken });

  const { accessToken } = res.data;

  localStorage.setItem('access', accessToken);

  return accessToken;
}

export function logout() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
}

export async function currentUser() {
  try {
    const { data } = await api.get('auth/me');
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}
