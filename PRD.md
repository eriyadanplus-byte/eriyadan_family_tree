# FAM — Eriyadan's Legacy Family Tree App
## Product Requirements Document v1.2 (Updated April 2026)

---

## 1. Executive Summary

Fam (Eriyadan's Legacy) is a private, invite-only family tree application. Members can visually explore their lineage through an interactive tree. Admins approve signups and manage deceased/historical ancestors.

**Stack:** Next.js 14.2 · TypeScript 5.3 · Tailwind CSS 3.4 · MySQL (dev) · Cloudflare D1 (target) · Cloudflare Pages

---

## 2. Completed Sprint (v1.0 → v1.1)

### 2.1 Critical Bug Fixes
| Bug | Fix |
|-----|-----|
| Black screen on localhost | Removed all `mysql2`/`mysql-db` imports from 6 API routes (view, config, approvals, stats, users, audit, export, test-db) — replaced with in-memory `db.ts` |
| Webpack `cannot read 'call'` crash | `Header.tsx` was missing (imported by old components). Created stub re-exporting `AppHeader` |
| Hydration error | Root cause was the Header.tsx crash; fixed by stub + AppShell cleanup |
| CSP blocking API calls | Removed `127.0.0.1:3000` connect-src restriction from middleware |
| Middleware loop | Added redirect for logged-in users away from `/`, `/login`, `/signup` |

### 2.2 Landing Page
- Only 2 CTAs: **"Join the Family"** (→ /signup) and **"Sign In"** (→ /login)
- Forest green `#0D1F0D` background, gold `#C8962E` accent
- Animated floating leaf decorations (CSS keyframes, reduced-motion safe)
- Desktop feature strip (hidden on mobile): Visual Tree · Honour the Late · Admin Approved
- No header/navbar on landing — fully clean

### 2.3 Signup — 3-Step Wizard
1. **Your Details** — Name, Email, Mobile
2. **Set Password** — with show/hide toggle
3. **Find Your Ancestor** — live debounced search (≥2 chars) with dropdown showing name + generation + status + location. Option: "I am the root / founding member"
- Pending-approval success screen after submit
- Back navigation between steps

### 2.4 Family Tree Visualisation
- **DesktopTree**: Custom SVG canvas with pan/drag + zoom controls
- **MobileTree**: React Flow (`@xyflow/react`) with MiniMap + Controls
- **Relationship labels on edges**: Father · Mother · Grandfather · Grandmother · Great-Grandfather · Great-Grandmother · Spouse
- Colour palette per generation (matches stitch reference):
  - Gen 1: Gold `#C8962E`
  - Gen 2: Green `#4CAF72`
  - Gen 3: Teal `#26A69A`
  - Gen 4: Blue `#42A5F5`
  - Gen 5: Purple `#AB47BC`
  - Gen 6: Pink `#EC407A`
  - Gen 7: Orange `#FF7043`
- Deceased nodes: Red `#EF5350` with `†` symbol
- Selected node: glowing border matching gen colour
- Focused node: gold highlight

### 2.5 Admin Panel
- **Sidebar**: Green-themed, `font-display` branding, active state highlighted
- **Approvals page**: Shows ancestor name, role selector (Viewer/Contributor/Editor), approve/reject with toast
- **Stats route**: All in-memory — no MySQL
- **AppHeader**: Simplified — Admin badge (gold) / Tree View badge (green)

### 2.6 Desktop Layout
- Landing: full viewport, no header
- Auth pages: no header/footer
- Member pages: fixed header + mobile bottom nav
- Admin pages: fixed header + collapsible sidebar (desktop) / drawer (mobile)
- `max-w-content` (1280px) on admin tables
- Admin sidebar: `w-64` sticky on desktop, drawer on mobile

### 2.7 Theme System (globals.css)
```
--bg-primary:    #0D1F0D
--primary:       #4CAF72
--primary-light: #81C784
--gold:          #C8962E
--glass-bg:      rgba(255,255,255,0.04)
--glass-border:  rgba(255,255,255,0.10)
```
Fonts: **Fraunces** (headings) · **Inter** (body)

### 2.8 App Router Compatibility Hardening (v1.1.1)
- Renamed `_MobileTreeInner.tsx` → `MobileTreeInner.tsx` for clarity.
- `@xyflow/react/dist/style.css` now imported once globally in `app/layout.tsx`; removed from the client component to eliminate SSR CSS-injection errors.
- Removed invalid `nodes` property from `fitViewOptions` (React Flow type error). Replaced with imperative `useReactFlow().fitView()` wrapped in a `useEffect` keyed on `focusId`, executed inside a `<ReactFlowProvider>` boundary.
- Component remains strictly client-only, loaded via `dynamic(() => import('./MobileTreeInner'), { ssr: false })` from `MobileTree.tsx`.

---

## 3. v1.2 Feature Sprint

### 3.1 Schema & Migration (003_v12.sql)
- Added `is_stub`, `claimed_by_user_id`, `added_by_member_id` to `members`
- Added `profile_photo_url`, `avatar_version` to `members`
- Added `current_role`, `company`, `facebook`, `youtube`, `custom_link` to `members`
- Added `can_approve` to `users`
- Created `approval_scopes` table (id, user_id, root_member_id, created_by, created_at)
- Created `spouses` table (member_a_id, member_b_id, status)
- Updated `schema.sql` and `seed.js`

### 3.2 Family Service Layer (`src/lib/family.ts`)
- `descendantIds(memberId)` — BFS traversal returning all descendant member IDs
- `spouseOf(memberId)` — returns current spouse member ID
- `childrenOf(memberId)` — returns child member IDs
- Used by approval scoping, member-driven add, and tree API

### 3.3 Avatar Upload Pipeline
- Client-side compression (≤200KB JPEG) via `AvatarUpload` component
- `POST /api/members/[id]/avatar` — saves to `/public/avatars/{id}.jpg`
- Profile page shows avatar with version query param for cache busting
- Tree nodes show profile photos or colored initials

### 3.4 Profile Fields & Social Links
- `ContactPanel` extended: Facebook, YouTube, custom link with icons
- Profile page updated with avatar upload UI, social fields, isStub/claimedBy display
- Member interface extended with all v1.2 fields

### 3.5 Member-Driven Add (Spouse/Child)
- `POST /api/members/relatives` — authenticated members can add stub spouses/children
- Stub members created with `is_stub=1`, `added_by_member_id` set
- Add Member page (`/tree/add`) uses relatives API for member-driven add
- Admin add still uses `/api/members` directly

### 3.6 Signup Disambiguation & Auto-Approval
- `POST /api/auth/signup` — supports `stubMemberId` + `relationType` fields
- If name + mobile match a stub member exactly → auto-approve (status=active, member_id linked)
- `GET /api/auth/signup/search` — returns members with photos, lineage info for disambiguation
- Signup page step 3: photo thumbnails in search, relation type picker (Child/Spouse/Sibling)
- Stub claim hint shown when unclaimed profile selected
- Success screen differentiates auto-approved vs pending

### 3.7 Editor Approval Scoping
- `GET/POST/DELETE /api/admin/approval-scopes` — CRUD for approval scopes
- Editors with `can_approve=1` can approve signups within their subtree scope
- Approvals API (`/api/admin/approvals`) filters pending list by editor scope
- `descendantIds()` used to determine scope membership
- `canApprove` added to `SessionUser` and JWT token

### 3.8 Tree UI Overhaul
- `MemberNode` shows profile photos or colored initials (purple=normal, rose=late, yellow=stub)
- `DesktopTree` nodes show avatar images with fallback to initials
- `MobileTreeInner` nodes show photos and isStub badges
- `SpousePair` component for side-by-side husband-wife display
- `GET /api/tree` — returns members grouped by generation with spouse info
- "Unclaimed" badge on stub nodes

### 3.9 Admin Editor Approval Rights UI
- `/admin/approval-scopes` page with editor + root member selection
- Search/filter for editors and members
- Add/delete scope operations
- Admin sidebar updated with "Approval Scopes" nav item

---

## 4. Current Architecture

### 4.1 Database (MySQL — Dev, Cloudflare D1 — Production target)
`/src/lib/mysql-db.ts` — MySQL connection pool with `query()` helper.
`/src/lib/audit-log.ts` — In-memory audit log (to be migrated to DB).
Production target: **Cloudflare D1** (SQLite) via `wrangler.toml` binding.

### 4.2 Auth
JWT in HttpOnly cookie (`session`). bcrypt password hashing.
Roles: `super_admin` · `editor` · `contributor` · `viewer`
`canApprove` flag on editors for scoped approval rights.

### 4.3 API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| /api/auth/signup | POST | Register + ancestor link + stub auto-approval |
| /api/auth/signup/search | GET | Member search for signup disambiguation |
| /api/auth/login | POST | JWT cookie (includes canApprove) |
| /api/auth/logout | POST | Clear cookie |
| /api/auth/session | GET | Current user |
| /api/auth/view | GET/POST | Admin/member view toggle |
| /api/members | GET/POST | List/create members |
| /api/members/[id] | GET/PUT/DELETE | Single member CRUD |
| /api/members/[id]/avatar | POST | Upload avatar |
| /api/members/relatives | POST | Member-driven add spouse/child |
| /api/tree | GET | Tree data with spouse pairing |
| /api/admin/approvals | GET/POST | Pending + approve/reject (scoped for editors) |
| /api/admin/approval-scopes | GET/POST/DELETE | Approval scope CRUD |
| /api/admin/stats | GET | Dashboard numbers |
| /api/admin/users | GET/PUT | User list + role change |
| /api/admin/config | GET/PUT | Site settings |
| /api/admin/audit | GET | Audit log |
| /api/export | GET | CSV/JSON export |

---

## 5. Cloudflare D1 Migration (Next Sprint)

Schema ready at `/db/schema.sql`. Steps:
1. `wrangler d1 create eriyaden_legacy`
2. `wrangler d1 execute eriyaden_legacy --file=./db/schema.sql`
3. Replace MySQL db calls with `env.DB.prepare(...).all()`
4. Add `@cloudflare/next-on-pages` adapter
5. Build: `npx @cloudflare/next-on-pages`
6. Deploy: `wrangler pages deploy .vercel/output/static`

---

## 6. Remaining Work (v1.3)

- [ ] Cloudflare D1 database swap
- [ ] Email notification on approval
- [ ] PWA manifest + service worker
- [ ] Arabic/Urdu language support
- [ ] Tree export as PNG
- [ ] Audit log DB persistence (replace in-memory)

---

## 7. Design Tokens Quick Reference

| Token | Value | Usage |
|-------|-------|-------|
| bg-primary | #0D1F0D | Page background |
| primary | #4CAF72 | CTAs, active states |
| primary-light | #81C784 | Hover, accents |
| gold | #C8962E | Legacy accent, Gen 1 |
| rose-late | #EF5350 | Deceased members |
| yellow-stub | #E6B84A | Unclaimed stub members |
| glass-bg | rgba(255,255,255,0.04) | Cards |
| font-display | Fraunces | Headings |
| font-sans | Inter | Body text |
