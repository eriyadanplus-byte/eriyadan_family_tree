# Eriyadan's Legacy — Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- MySQL 8+ (local development)
- Vercel account (for hosting)
- Supabase account (for production database + storage)

---

## 1. Clone and Install

```bash
git clone <your-repo-url>
cd family_tree
npm install
```

## 2. Environment Variables (Local Dev)

Copy `.env.example` → `.env.local` and fill in your values:

```env
# Database (local development — MySQL)
DATABASE_PROVIDER=mysql
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=family_tree
MYSQL_PORT=3306

# JWT (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# App
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 3. Database Setup (Local)

```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS family_tree;"

# Run schema + migrations
mysql -u root -p family_tree < db/schema.sql
mysql -u root -p family_tree < db/migrations/0006_presence_tracking.sql
# ... run any other migration files in db/migrations/
```

## 4. Bootstrap Admin

```bash
node scripts/bootstrap-admin.js
```

This creates a single `super_admin` user:

| Field     | Value                    |
|-----------|--------------------------|
| Email     | `eriyadanplus@gmail.com` |
| Password  | `Eriyadan@2024!`         |
| Role      | `super_admin`            |
| Status    | `active`                 |
| member_id | `NULL` (unlinked)        |

> **IMPORTANT:** Change the default password immediately after first login.

## 5. Start Development Server

```bash
npm run dev
```

Open `http://localhost:3000` and sign in with the credentials above.

---

## 6. Change Password (In-App)

1. Sign in as admin
2. Go to **Admin → Settings → Account Security**
3. Enter current password `Eriyadan@2024!`
4. Set a strong new password (min 8 characters)
5. Click **Change Password**

## 7. Manual Password Reset (If Locked Out)

If you forget the admin password, reset it directly in the database:

```bash
# 1. Generate a bcrypt hash for the new password
node -e "const b=require('bcryptjs'); b.hash('YourNewPass123!',10).then(console.log)"

# 2. Update the database (replace <hash> with the output from step 1)
mysql -u root -p -e "UPDATE family_tree.users SET password='<hash>' WHERE email='eriyadanplus@gmail.com';"
```

## 8. Link Your Lineage (Optional)

The admin account starts **unlinked** to any family member. All admin features work regardless.

To appear in the family tree:
1. Go to **Admin → Generation Seed** (or `/admin/founding`)
2. Add yourself as the founding ancestor, or
3. Go to **Admin → Members → Add Member** and create your profile
4. Your `member_id` will be linked automatically

## 9. Inviting Other Members

Share the public signup link (`/signup`) with family members. They will:
1. Search for their ancestor in the tree
2. Select their relationship (child, spouse, sibling)
3. Submit for admin approval
4. Once approved, they can sign in and explore the tree

---

## 10. Production Deploy (Supabase + Vercel)

### 10.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the PostgreSQL schema from `db/supabase/schema.sql` (create this file by porting `db/schema.sql` to PostgreSQL syntax)
3. Enable Row Level Security (RLS) on all tables
4. Create a public Storage bucket named `avatars` with authenticated upload policy

### 10.2 Environment Variables (Vercel)

In your Vercel project settings, add:

```env
DATABASE_PROVIDER=supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=<strong-production-secret-min-32-chars>
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

> **Remove all `MYSQL_*` variables in production.**

### 10.3 Deploy

```bash
vercel --prod
```

### 10.4 Production Bootstrap

After the first deploy, run the bootstrap from your local machine pointed at the Supabase database (or use Supabase's SQL editor to insert the admin user directly).

---

## Quick Reference

| Task | Command |
|------|---------|
| Local dev | `npm run dev` |
| Bootstrap admin | `node scripts/bootstrap-admin.js` |
| Build | `npm run build` |
| Deploy to Vercel | `vercel --prod` |
| Reset password (SQL) | See section 7 above |

---

## Support

If you need help, use the **"Need help?"** button on the login or signup page to message the admin.
