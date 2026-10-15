import { describe, it, expect } from 'vitest';
import { signAdminSession, verifyAdminSession, isAdminRequest, ADMIN_COOKIE } from './adminSession';

const SECRET = 'unit-test-secret-unit-test-secret';
const user = { id: 'u1', email: 'a@b.co', role: 'admin' };

function req(opts: { cookie?: string; key?: string }) {
  const headers = new Headers();
  if (opts.key) headers.set('x-rag-admin-key', opts.key);
  return {
    headers,
    cookies: { get: (n: string) => (n === ADMIN_COOKIE && opts.cookie ? { value: opts.cookie } : undefined) },
  };
}

describe('admin session', () => {
  it('round-trips a signed token', () => {
    const t = signAdminSession(user, SECRET);
    expect(verifyAdminSession(t, SECRET)).toMatchObject(user);
  });

  it('rejects a tampered token', () => {
    const t = signAdminSession(user, SECRET);
    expect(verifyAdminSession(t.slice(0, -2) + 'xx', SECRET)).toBeNull();
  });

  it('rejects a token signed with another secret', () => {
    const t = signAdminSession(user, 'other-secret-other-secret-other');
    expect(verifyAdminSession(t, SECRET)).toBeNull();
  });

  it('rejects an expired token', () => {
    const t = signAdminSession(user, SECRET, Date.now() - 1000 * 60 * 60 * 24 * 2);
    expect(verifyAdminSession(t, SECRET)).toBeNull();
  });

  it('accepts a valid cookie', () => {
    process.env.ADMIN_SESSION_SECRET = SECRET;
    expect(isAdminRequest(req({ cookie: signAdminSession(user, SECRET) }))).toBe(true);
  });

  it('accepts the admin key header only when it matches and is non-empty', () => {
    process.env.ADMIN_SESSION_SECRET = SECRET;
    process.env.RAG_ADMIN_KEY = 'k-123456789';
    expect(isAdminRequest(req({ key: 'k-123456789' }))).toBe(true);
    expect(isAdminRequest(req({ key: 'wrong' }))).toBe(false);
    process.env.RAG_ADMIN_KEY = '';
    expect(isAdminRequest(req({ key: '' }))).toBe(false);
  });

  it('rejects requests with nothing', () => {
    process.env.ADMIN_SESSION_SECRET = SECRET;
    process.env.RAG_ADMIN_KEY = 'k-123456789';
    expect(isAdminRequest(req({}))).toBe(false);
  });
});
