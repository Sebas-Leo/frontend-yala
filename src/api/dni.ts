// DNI identity verification for Yala buyers — the platform's trust pillar:
// a buyer must verify their DNI before bidding or buying.
//
// This module calls the Yala backend (POST /api/v1/identity/verify), which in
// turn validates against RENIEC via Didit's Database Validation API
// (POST https://verification.didit.me/v3/database-validation/).
//
// Keeping the Didit call server-side means:
//   - The DIDIT_API_KEY secret never reaches the browser.
//   - The verification result is persisted on user.isIdentityVerified in the DB.
//   - The backend broadcasts /topic/identity/{userId} via STOMP so AuthContext
//     updates isIdentityVerified in real time without a page reload.
//
// When the backend has no DIDIT_API_KEY configured, it falls back to demo mode
// (any valid 8-digit DNI is accepted) and returns { source: "demo" }.

import { getAccessToken } from './tokens';

const ENDPOINT = '/api/v1/identity/verify';

function makeResult(partial: any) {
  return {
    verified: false,
    source: 'demo',
    reason: null,
    raw: null,
    ...partial,
  };
}

function demoResult(personalNumber: string, reason?: string) {
  return makeResult({ verified: /^\d{8}$/.test(personalNumber), source: 'demo', reason });
}

/**
 * Verify a Peruvian DNI via the Yala backend (which calls Didit/RENIEC server-side).
 * Requires the user to be authenticated (JWT in localStorage).
 */
export async function verifyDni({ dni, firstName = '', lastName = '' }: {
  dni: string;
  firstName?: string;
  lastName?: string;
}) {
  const personalNumber = String(dni || '').replace(/\D/g, '');
  if (!/^\d{8}$/.test(personalNumber)) {
    return makeResult({ verified: false, source: 'demo', reason: 'invalid-format' });
  }

  const token = getAccessToken();

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        personalNumber,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      }),
    });
  } catch {
    // Backend unreachable (e.g. no network in a demo without a local backend).
    return demoResult(personalNumber, 'backend-unreachable');
  }

  // Not authenticated — should not happen on a protected route, but handle gracefully.
  if (res.status === 401 || res.status === 403) {
    return demoResult(personalNumber, 'unauthenticated');
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    return makeResult({ verified: false, source: 'backend', reason: 'http-error', raw: data });
  }

  return makeResult({
    verified: !!data?.verified,
    source: data?.source ?? 'didit',
    reason: data?.reason ?? null,
    raw: data,
  });
}
