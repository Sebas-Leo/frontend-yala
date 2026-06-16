// HTTP client for the Yala backend (Spring Boot, base path /api/v1).
// Responsibilities:
//   - Prefix every request with VITE_API_BASE_URL.
//   - Attach the JWT access token as `Authorization: Bearer <token>`.
//   - On 401, transparently refresh the access token (POST /auth/refresh-token)
//     and retry the original request once. Concurrent 401s share one refresh.
//   - Normalize backend errors into ApiError (status + code + message).

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from './tokens.js';

// Default to a same-origin relative base ('/api/v1') so the Vite dev proxy
// (see vite.config.js) forwards to the backend on :8081 without CORS.
// Override with VITE_API_BASE_URL for an absolute URL (e.g. production).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message || 'Error de conexión con el servidor');
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// One in-flight refresh shared across concurrent 401s.
let refreshPromise = null;

function buildRequest(path, { method = 'GET', body, headers = {}, auth = true, signal } = {}) {
  const finalHeaders = { ...headers };
  let payload = body;

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  return fetch(`${BASE_URL}${path}`, { method, headers: finalHeaders, body: payload, signal });
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function parse(res) {
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    // Backend ErrorResponse shape: { code, message, status, path, timestamp }.
    const code = (data && (data.code || data.error)) || `HTTP_${res.status}`;
    const message = (data && data.message) || res.statusText;
    throw new ApiError(res.status, code, message, data);
  }
  return data;
}

async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = buildRequest('/auth/refresh-token', {
      method: 'POST',
      body: { refreshToken },
      auth: false,
    })
      .then(parse)
      .then((data) => {
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        return true;
      })
      .catch(() => {
        clearTokens();
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function request(path, options = {}) {
  let res = await buildRequest(path, options);

  if (res.status === 401 && options.auth !== false && !options._retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await buildRequest(path, { ...options, _retry: true });
    }
  }

  return parse(res);
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

export { BASE_URL };
