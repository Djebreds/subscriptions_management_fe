export function setTokenClient(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function getTokenClient() {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  return { accessToken, refreshToken };
}

export function deleteTokenClient() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
