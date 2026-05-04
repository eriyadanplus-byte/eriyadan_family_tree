import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const HELP_ANON_COOKIE = 'help_anon';

export function issueAnonHelpToken(): { token: string; hash: string } {
  const anonId = `anon:${randomUUID()}`;
  const token = jwt.sign({ sub: anonId, kind: 'help_anon' }, JWT_SECRET, { expiresIn: '7d' });
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

export function verifyAnonHelpToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; kind: string };
    if (decoded.kind !== 'help_anon') return null;
    return decoded.sub;
  } catch {
    return null;
  }
}

export function hashAnonToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export { HELP_ANON_COOKIE };
