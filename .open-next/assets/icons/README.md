# PWA App Icons

Replace these placeholder files with proper PNG icons before publishing.

| File | Size | Usage |
|---|---|---|
| `icon-192.png` | 192×192 | Android home screen, Chrome install |
| `icon-512.png` | 512×512 | Splash screen, high-DPI displays |
| `icon-512-maskable.png` | 512×512 | Android adaptive icon (safe zone: center 80%) |
| `apple-touch-icon.png` | 180×180 | iOS Safari Add to Home Screen |

## How to generate

1. Create a 1024×1024 master SVG/PNG with your logo on the `#0D1F0D` background.
2. Use https://realfavicongenerator.net or `sharp` to resize to required dimensions.
3. For the maskable icon, keep the logo within the center 80% (safe zone).

## Quick script (Node.js + sharp)

```bash
npm install -D sharp
node scripts/gen-icons.mjs
```

```js
// scripts/gen-icons.mjs
import sharp from 'sharp';
const src = 'public/icons/master.png';
await sharp(src).resize(192).toFile('public/icons/icon-192.png');
await sharp(src).resize(512).toFile('public/icons/icon-512.png');
await sharp(src).resize(512).toFile('public/icons/icon-512-maskable.png');
await sharp(src).resize(180).toFile('public/icons/apple-touch-icon.png');
```
