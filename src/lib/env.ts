const REQUIRED = ['JWT_SECRET', 'MYSQL_PASSWORD'] as const;

export function validateEnv() {
  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length) {
    const msg = `Missing required env vars: ${missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') throw new Error(msg);
    console.warn('[env]', msg);
  }
}
