---
status: resolved
trigger: "DB deadlocks during npm run build — concurrent initDB() calls race on INSERT IGNORE INTO app_settings"
created: 2026-05-02T00:05:00Z
updated: 2026-05-02T00:10:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED — initDB() is not a singleton. Every route handler calls it directly, causing N concurrent executions during build-time static page collection. All N runs execute the same INSERT IGNORE INTO app_settings rows simultaneously → MySQL deadlock (ER_LOCK_DEADLOCK errno 1213).
test: Read src/lib/mysql-db.ts — confirmed no singleton guard. initDB() is a plain async function with no module-level promise cache.
expecting: Wrapping the init body in a shared module-level promise ensures all concurrent callers await the same single execution — zero duplicate INSERT races.
next_action: RESOLVED — fix confirmed by user.

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: npm run build completes without DB errors
actual: Build logs show repeated ER_LOCK_DEADLOCK errors from multiple route handlers (api/auth/login, api/health, others) all hitting the same INSERT IGNORE
errors: |
  DB init error: Error: Deadlock found when trying to get lock; try restarting transaction
    code: 'ER_LOCK_DEADLOCK', errno: 1213, sqlState: '40001'
    sql: INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES ('siteName', ...), ...
reproduction: npm run build — Next.js static collection fires all API route handlers concurrently
started: Always present; becomes visible during build due to parallel route invocation

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: MySQL configuration or table locking strategy
  evidence: INSERT IGNORE on the same unique-key rows from N concurrent connections is a well-known deadlock pattern in MySQL — the fix is at the application level (singleton), not DB config
  timestamp: 2026-05-02T00:05:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-05-02T00:05:00Z
  checked: src/lib/mysql-db.ts — initDB() definition (lines 24-255)
  found: Plain async function, no module-level guard. The auto-init at line 258 only prevents the auto-init from running twice, but each explicit initDB() call from a route handler triggers a fresh execution of the entire body independently.
  implication: During build, N route handlers each call initDB() → N concurrent runs → N concurrent INSERT IGNORE on app_settings → MySQL deadlock

- timestamp: 2026-05-02T00:05:00Z
  checked: Line 258 — initDB().catch(...)
  found: Auto-init exists but does not prevent explicit caller re-entrancy
  implication: The singleton must be on the exported initDB() function itself so ALL callers (auto + explicit) share one promise

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: initDB() has no singleton guard. During build, Next.js invokes all API route handlers concurrently for static page generation. Each handler calls initDB() independently, creating N concurrent executions that all race to INSERT IGNORE the same app_settings rows. MySQL detects a deadlock and throws ER_LOCK_DEADLOCK (errno 1213). The build catches and logs the error rather than throwing, so it succeeds, but the DB state is left partially initialized for some routes.
fix: Add a module-level `let dbInitPromise: Promise<void> | null = null`. On first call, initDB() assigns the inner async body to dbInitPromise and returns it. All subsequent calls return the same promise immediately — no re-execution, no concurrent INSERT.
verification: Confirmed fixed by user — build no longer produces ER_LOCK_DEADLOCK errors.
files_changed:
  - src/lib/mysql-db.ts
