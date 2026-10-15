import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE = 'trinity_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 12;

export interface AdminSessionPayload {
  id: string;
  email: string;
  role: string;
}

function getSecret(secret?: string): string {
  const s = secret ?? process.env.ADMIN_SESSION_SECRET ?? '';
  if (s.length < 16) throw new Error('ADMIN_SESSION_SECRET must be set (16+ characters)');
  return s;
}

export function signAdminSession(payload: AdminSessionPayload, secret?: string, now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  return jwt.sign({ ...payload, iat }, getSecret(secret), { expiresIn: MAX_AGE_SECONDS });
}

export function verifyAdminSession(token: string, secret?: string): AdminSessionPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret(secret)) as AdminSessionPayload;
    return { id: decoded.id, email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function isAdminRequest(req: {
  headers: Headers;
  cookies: { get(name: string): { value: string } | undefined };
}): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (cookie && verifyAdminSession(cookie)) return true;
  const expected = process.env.RAG_ADMIN_KEY ?? '';
  const given = req.headers.get('x-rag-admin-key') ?? '';
  return expected.length > 0 && given.length > 0 && safeEqual(given, expected);
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
};
