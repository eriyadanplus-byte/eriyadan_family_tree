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
const { cpSync, copyFileSync, existsSync } = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OPEN_NEXT = path.join(ROOT, ".open-next");
const ASSETS = path.join(OPEN_NEXT, "assets");

console.log("→ Building with @opennextjs/cloudflare...");
execSync("npx opennextjs-cloudflare build", { stdio: "inherit" });

const companions = ["cloudflare", "middleware", ".build", "server-functions"];

for (const dir of companions) {
  const src = path.join(OPEN_NEXT, dir);
  const dest = path.join(ASSETS, dir);
  if (existsSync(src)) {
    console.log(`→ Copying .open-next/${dir} → assets/${dir}`);
    cpSync(src, dest, { recursive: true, force: true });
  }
}

console.log("→ Copying worker.js → assets/_worker.js");
copyFileSync(path.join(OPEN_NEXT, "worker.js"), path.join(ASSETS, "_worker.js"));

console.log("✓ CF Pages build complete");
