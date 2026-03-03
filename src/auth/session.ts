/**
 * HMAC-signed session cookie management.
 *
 * Creates and validates session tokens with 24-hour expiry.
 * No external dependencies - uses Node.js crypto for HMAC-SHA256.
 */

import { createHmac } from 'node:crypto';
import type { Request, Response } from 'express';
import { generateRandomToken } from './oauth-store.js';

const SESSION_COOKIE_NAME = 'ghost_mcp_session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Creates a session token: timestamp.randomId.hmac
 */
export function createSessionToken(secretKey: string): string {
  const timestamp = Date.now().toString(36);
  const randomId = generateRandomToken();
  const payload = `${timestamp}.${randomId}`;
  const hmac = createHmac('sha256', secretKey).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

/**
 * Validates a session token: verifies HMAC signature and checks expiry.
 */
export function validateSessionToken(token: string, secretKey: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [timestamp, randomId, providedHmac] = parts;
  const payload = `${timestamp}.${randomId}`;
  const expectedHmac = createHmac('sha256', secretKey).update(payload).digest('hex');

  // Verify HMAC
  if (providedHmac !== expectedHmac) return false;

  // Check expiry
  const createdAt = parseInt(timestamp, 36);
  if (isNaN(createdAt)) return false;
  if (Date.now() - createdAt > SESSION_EXPIRY_MS) return false;

  return true;
}

/**
 * Sets an httpOnly session cookie on the response.
 */
export function setSessionCookie(res: Response, secretKey: string): void {
  const token = createSessionToken(secretKey);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_MS,
    path: '/',
  });
}

/**
 * Retrieves and validates the session from the request cookie.
 * Returns true if a valid session exists.
 */
export function getSessionFromRequest(req: Request, secretKey: string): boolean {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return false;

  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return false;

  return validateSessionToken(token, secretKey);
}

/**
 * Clears the session cookie.
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Simple cookie parser (avoids cookie-parser dependency).
 */
function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const pair of header.split(';')) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) continue;
    const key = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

export { SESSION_COOKIE_NAME, SESSION_EXPIRY_MS };
