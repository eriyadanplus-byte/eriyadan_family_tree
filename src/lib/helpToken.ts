import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const HELP_ANON_COOKIE = 'help_anon';

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function issueAnonHelpToken(): Promise<{ token: string; hash: string }> {
  const anonId = `anon:${crypto.randomUUID()}`;
  const token = await new SignJWT({ sub: anonId, kind: 'help_anon' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
  const hash = await sha256Hex(token);
  return { token, hash };
}

export async function verifyAnonHelpToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { clockTolerance: 60 });
    if (payload.kind !== 'help_anon') return null;
    return payload.sub as string;
  } catch {
    return null;
  }
}

export async function hashAnonToken(token: string): Promise<string> {
  return sha256Hex(token);
}

export { HELP_ANON_COOKIE };
