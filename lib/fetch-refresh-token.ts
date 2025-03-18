import { refreshAccessToken } from './refresh-token';

export async function fetchWithAuth(
  url: string,
  options: any,
  refreshToken: string
) {
  let response = await fetch(url, options);

  if (response.status === 401) {
    const newAccessToken = await refreshAccessToken(refreshToken);
    if (!newAccessToken) {
      return { error: 'Unable to refresh token', status: 401 };
    }

    options.headers.Authorization = `Bearer ${newAccessToken}`;
    response = await fetch(url, options);
  }

  return response;
}
