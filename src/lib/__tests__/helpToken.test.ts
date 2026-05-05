// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { SignJWT } from 'jose';
import { issueAnonHelpToken, verifyAnonHelpToken, hashAnonToken } from '../helpToken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

describe('helpToken', () => {
  it('issueAnonHelpToken returns a token and its sha256 hash', async () => {
    const { token, hash } = await issueAnonHelpToken();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT structure
    expect(hash).toHaveLength(64);          // hex sha256
  });

  it('hashAnonToken(token) matches the hash returned at issue time', async () => {
    const { token, hash } = await issueAnonHelpToken();
    const computedHash = await hashAnonToken(token);
    expect(computedHash).toBe(hash);
  });

  it('verifyAnonHelpToken returns the anon sub for a valid token', async () => {
    const { token } = await issueAnonHelpToken();
    const sub = await verifyAnonHelpToken(token);
    expect(sub).not.toBeNull();
    expect(sub!.startsWith('anon:')).toBe(true);
  });

  it('verifyAnonHelpToken returns null for a tampered token', async () => {
    const { token } = await issueAnonHelpToken();
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(await verifyAnonHelpToken(tampered)).toBeNull();
  });

  it('verifyAnonHelpToken returns null for a regular session JWT (wrong kind)', async () => {
    // A manually crafted JWT with kind != 'help_anon' should be rejected
    const wrongToken = await new SignJWT({ sub: 'user:1', kind: 'session' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(getSecretKey());
    expect(await verifyAnonHelpToken(wrongToken)).toBeNull();
  });

  it('each issued token is unique (different UUID)', async () => {
    const a = await issueAnonHelpToken();
    const b = await issueAnonHelpToken();
    expect(a.token).not.toBe(b.token);
    expect(a.hash).not.toBe(b.hash);
  });
});
