// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { issueAnonHelpToken, verifyAnonHelpToken, hashAnonToken } from '../helpToken';

describe('helpToken', () => {
  it('issueAnonHelpToken returns a token and its sha256 hash', () => {
    const { token, hash } = issueAnonHelpToken();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT structure
    expect(hash).toHaveLength(64);          // hex sha256
  });

  it('hashAnonToken(token) matches the hash returned at issue time', () => {
    const { token, hash } = issueAnonHelpToken();
    expect(hashAnonToken(token)).toBe(hash);
  });

  it('verifyAnonHelpToken returns the anon sub for a valid token', () => {
    const { token } = issueAnonHelpToken();
    const sub = verifyAnonHelpToken(token);
    expect(sub).not.toBeNull();
    expect(sub!.startsWith('anon:')).toBe(true);
  });

  it('verifyAnonHelpToken returns null for a tampered token', () => {
    const { token } = issueAnonHelpToken();
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(verifyAnonHelpToken(tampered)).toBeNull();
  });

  it('verifyAnonHelpToken returns null for a regular session JWT (wrong kind)', () => {
    // A manually crafted JWT with kind != 'help_anon' should be rejected
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    const wrongToken = jwt.sign({ sub: 'user:1', kind: 'session' }, JWT_SECRET);
    expect(verifyAnonHelpToken(wrongToken)).toBeNull();
  });

  it('each issued token is unique (different UUID)', () => {
    const a = issueAnonHelpToken();
    const b = issueAnonHelpToken();
    expect(a.token).not.toBe(b.token);
    expect(a.hash).not.toBe(b.hash);
  });
});
