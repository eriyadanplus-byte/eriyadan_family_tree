#!/usr/bin/env node

// Script to generate password hash for superadmin
// Run this script: node scripts/generate-superadmin-hash.js

async function hashPassword(password) {
  // Implement the same hashing logic as in src/lib/auth.ts
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateHash() {
  try {
    const password = process.env.ADMIN_PASSWORD || (() => { throw new Error('Set ADMIN_PASSWORD env var'); })();
    const hash = await hashPassword(password);

    console.log('Password hash generated successfully!');
    console.log('Hash:', hash);
    console.log('');
    console.log('Copy this hash and replace "PLACEHOLDER_HASH_REPLACE_WITH_ACTUAL_HASH" in:');
    console.log('db/supabase/seed.sql');
    
    return hash;
  } catch (error) {
    console.error('Error generating hash:', error.message);
    process.exit(1);
  }
}

// Run the function
generateHash();