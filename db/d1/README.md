# Cloudflare D1 Migration Guide

This folder contains the SQLite-compatible schema for migrating from MySQL to Cloudflare D1.
**This does NOT change the current MySQL runtime** — it's schema assets only.

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Complete D1 schema (all 10 tables + triggers + indexes) |
| `migrations/0001_initial.sql` | Full initial migration (same as schema.sql) |
| `migrations/0002–0005_*.sql` | Parity stubs matching MySQL migration numbering |

## How to apply

### 1. Install Wrangler
```bash
npm install -g wrangler
wrangler login
```

### 2. Create the D1 database
```bash
wrangler d1 create eriyaden
# Output will show: database_id = "xxxx-xxxx-..."
# Paste that ID into wrangler.toml → [[d1_databases]] database_id
```

### 3. Apply migrations locally (test)
```bash
wrangler d1 migrations apply eriyaden --local
# Verify: wrangler d1 execute eriyaden --local --command ".tables"
```

### 4. Apply to production
```bash
wrangler d1 migrations apply eriyaden --remote
```

## MySQL → SQLite conversion notes

| MySQL | D1 / SQLite |
|---|---|
| `AUTO_INCREMENT` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| `ENUM('a','b')` | `TEXT CHECK (col IN ('a','b'))` |
| `BOOLEAN` | `INTEGER CHECK (col IN (0,1))` |
| `ON UPDATE CURRENT_TIMESTAMP` | `CREATE TRIGGER ... AFTER UPDATE` |
| `JSON` | `TEXT` (app uses JSON.parse/JSON.stringify) |
| `INFORMATION_SCHEMA` guards | Not needed — Wrangler tracks applied migrations |
| `INSERT IGNORE` | `INSERT OR IGNORE` |

## Runtime cutover (future)

When ready to switch from MySQL to D1:
1. Add the D1 client binding in `src/lib/d1-db.ts`
2. Replace `import { query } from '@/lib/mysql-db'` with the D1 equivalent
3. The query interface is the same (parameterized `?` placeholders work identically)
