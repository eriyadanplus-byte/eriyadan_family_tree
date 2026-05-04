# Database — Connection & Migration Guide

## Connection

Driver: `mysql2/promise` pool — `src/lib/mysql-db.ts`

| Env var | Default | Purpose |
|---|---|---|
| `MYSQL_HOST` | `127.0.0.1` | MySQL server host |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_USER` | `root` | DB user |
| `MYSQL_PASSWORD` | *(empty)* | DB password |
| `MYSQL_DATABASE` | `family_tree` | Database name |

Set these in `.env.local`. Pool size: 10 connections.

## Live schema source of truth

`src/lib/mysql-db.ts` → `initDB()` runs `CREATE TABLE IF NOT EXISTS` for all 9 tables on every server boot. This is the **authoritative** MySQL schema.

## Tables

| Table | Purpose |
|---|---|
| `users` | Auth accounts with roles (super_admin / editor / contributor / viewer) |
| `members` | Family tree genealogical records — name, gen, parents, spouse, social links |
| `spouses` | Denormalized marriage records mirroring members.spouse_id |
| `relationships` | Legacy parent/spouse relationship type records |
| `approval_scopes` | Subtree editor delegation — which user can approve edits under which root member |
| `app_settings` | Key-value config store (persisted app configuration) |
| `audit_log` | Action audit trail — who did what to which member |
| `help_threads` | In-app help/messaging threads for signup flow and support |
| `help_messages` | Individual messages within a help thread |

## How to add a DROP / ALTER migration

1. Create `db/migrations/005_<description>.sql` (next number after `004`).
2. Use idempotent guards — the pattern already used in the existing migrations:

```sql
-- Safe ALTER (MySQL)
SET @exist = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'members'
    AND COLUMN_NAME = 'new_col'
);
SET @sql = IF(@exist = 0, 'ALTER TABLE members ADD COLUMN new_col TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

3. Apply it:
```bash
mysql -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < db/migrations/005_description.sql
```

Or add to `package.json`:
```json
"db:migrate": "for f in db/migrations/*.sql; do mysql -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < $f; done"
```

> **Note:** `setup-tables.sql` is legacy — do not use it.  
> **For Cloudflare D1 / SQLite:** see `db/d1/README.md`.
