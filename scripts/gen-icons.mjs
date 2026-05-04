/**
 * Generate PWA icons from a master image.
 * Usage: node scripts/gen-icons.mjs [path/to/master.png]
 * Requires: npm install -D sharp
 */
import sharp from 'sharp';
import { existsSync } from 'fs';

const src = process.argv[2] ?? 'public/icons/master.png';
if (!existsSync(src)) {
  console.error(`Source file not found: ${src}`);
  console.error('Provide a 1024x1024 PNG as the first argument, or place it at public/icons/master.png');
  process.exit(1);
}

const sizes = [
  { file: 'public/icons/icon-192.png',          size: 192 },
  { file: 'public/icons/icon-512.png',          size: 512 },
  { file: 'public/icons/icon-512-maskable.png', size: 512 },
  { file: 'public/icons/apple-touch-icon.png',  size: 180 },
];

for (const { file, size } of sizes) {
  await sharp(src).resize(size, size).png().toFile(file);
  console.log(`✓ ${file} (${size}x${size})`);
}
console.log('Done. Replace public/icons/master.png with your actual logo and re-run.');
