# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## db-initdb-deadlock — initDB() singleton missing causes MySQL deadlock during Next.js build
- **Date:** 2026-05-02
- **Error patterns:** ER_LOCK_DEADLOCK, errno 1213, sqlState 40001, INSERT IGNORE, app_settings, deadlock, initDB, concurrent, build
- **Root cause:** initDB() had no module-level singleton guard. Next.js invokes all API route handlers concurrently during static page generation, so N handlers each called initDB() independently, racing to INSERT IGNORE the same app_settings rows and triggering MySQL deadlock.
- **Fix:** Wrapped initDB() body in a module-level `dbInitPromise` singleton (`let dbInitPromise: Promise<void> | null = null`). First call executes the body and caches the promise; all subsequent calls return the cached promise immediately.
- **Files changed:** src/lib/mysql-db.ts
---

## webpack-hydration-undefined-call — stale .next cache + @xyflow/react "use client" causes webpack factory crash at hydration
- **Date:** 2026-05-02
- **Error patterns:** TypeError, Cannot read properties of undefined, reading call, options.factory, webpack.js, __webpack_require__, react-server-dom-webpack-client, hydration, transpilePackages, xyflow, use client, stale cache, Header.tsx
- **Root cause:** Two compounding issues. PRIMARY: Header.tsx was renamed to AppHeader.tsx but .next cache was never cleared — stale compiled chunks referencing the old Header.tsx path were reused by incremental builds, embedding a dead module reference in app/page.js that crashed webpack module resolution at hydration time. SECONDARY: @xyflow/react ESM bundle starts with "use client", causing Next.js 15 RSC bundler to misclassify it as an RSC boundary without transpilePackages.
- **Fix:** (1) Added `transpilePackages: ['@xyflow/react', '@xyflow/system']` to next.config.mjs. (2) Added mysql2 to serverExternalPackages and moved mysql2/bcryptjs/sharp to dependencies. (3) Deleted .next directory entirely to force a full clean build.
- **Files changed:** next.config.mjs, package.json
---

