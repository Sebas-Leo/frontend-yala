// JWT token storage for the Yala session.
// Access token expires in 1h, refresh token in 7d (see backend ResponseAuthDTO).
// Kept in localStorage so the session survives reloads; the client interceptor
// silently refreshes the access token using the refresh token on 401.

const ACCESS_KEY = 'yala.accessToken';
const REFRESH_KEY = 'yala.refreshToken';

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export function setTokens({ accessToken, refreshToken } = {}) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
