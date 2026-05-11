#!/usr/bin/env node
/**
 * CF Pages build script for @opennextjs/cloudflare
 *
 * opennextjs-cloudflare build outputs:
 *   .open-next/worker.js          <- main worker entry
 *   .open-next/cloudflare/        <- cloudflare helpers
 *   .open-next/middleware/        <- middleware handler
 *   .open-next/.build/            <- durable objects + server functions bundle
 *   .open-next/server-functions/  <- server function handlers
 *   .open-next/assets/            <- static files (CF Pages output dir)
 *
 * CF Pages bundles _worker.js via esbuild and resolves imports relative to
 * pages_build_output_dir (.open-next/assets). We must copy all companion
 * directories + rename worker.js -> _worker.js inside assets/.
 */

const { execSync } = require("child_process");
const { cpSync, copyFileSync, existsSync, readdirSync, rmSync } = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OPEN_NEXT = path.join(ROOT, ".open-next");
const ASSETS = path.join(OPEN_NEXT, "assets");

// Clean previous build to ensure fresh output
console.log("→ Cleaning previous build...");
if (existsSync(OPEN_NEXT)) {
  rmSync(OPEN_NEXT, { recursive: true, force: true });
  console.log("  ✓ Cleaned .open-next/");
}

console.log("→ Building with @opennextjs/cloudflare...");
console.log(`  CWD: ${ROOT}`);
execSync("npx opennextjs-cloudflare build", { stdio: "inherit" });

// Debug: show what was generated
console.log("\n→ Build output check:");
if (existsSync(OPEN_NEXT)) {
  console.log(`  .open-next contents: ${readdirSync(OPEN_NEXT).join(", ")}`);
} else {
  console.log("  ERROR: .open-next/ not found!");
  process.exit(1);
}

// Ensure assets exists
if (!existsSync(ASSETS)) {
  console.log("  ERROR: .open-next/assets/ not found!");
  process.exit(1);
}

const companions = ["cloudflare", "middleware", ".build", "server-functions"];

for (const dir of companions) {
  const src = path.join(OPEN_NEXT, dir);
  const dest = path.join(ASSETS, dir);
  if (existsSync(src)) {
    console.log(`→ Copying .open-next/${dir} → assets/${dir}`);
    cpSync(src, dest, { recursive: true, force: true });
    console.log(`  ✓ Copied ${dir}`);
  } else {
    console.log(`  ⚠ Skipped ${dir} (not found)`);
  }
}

console.log("→ Copying worker.js → assets/_worker.js");
const workerSrc = path.join(OPEN_NEXT, "worker.js");
const workerDest = path.join(ASSETS, "_worker.js");
if (existsSync(workerSrc)) {
  copyFileSync(workerSrc, workerDest);
  console.log(`  ✓ Copied worker.js`);
} else {
  console.log("  ERROR: worker.js not found!");
  process.exit(1);
}

// Debug: show final assets contents
console.log("\n→ Final assets/ contents:");
console.log(`  ${readdirSync(ASSETS, { recursive: true }).join("\n  ")}`);

console.log("\n✓ CF Pages build complete");
