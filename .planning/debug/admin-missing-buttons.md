---
status: awaiting_human_verify
trigger: "Admin dashboard shows only 'Family Tree' with no other functional buttons/nav visible. Members page also has issues. Affects both desktop and mobile."
created: 2026-05-02T00:00:00Z
updated: 2026-05-02T00:00:00Z
---

## Current Focus

hypothesis: layout.tsx was restored as a bare stub that omits LayoutClient (which wraps AppShell, which renders AdminSidebar + AppHeader for admin routes). Without LayoutClient in layout.tsx, every page gets zero shell — no sidebar, no header, no admin nav.
test: Confirmed by reading layout.tsx (no LayoutClient import/render) and LayoutClient.tsx (wraps AppShell which provides full admin layout).
expecting: Adding LayoutClient back to layout.tsx body will restore the full sidebar + header on all admin pages.
next_action: Edit layout.tsx to import and render LayoutClient around {children}

## Symptoms

expected: Admin dashboard shows full navigation/buttons — Members, Settings, Approvals, Audit, etc. Members page shows member list with functional controls.
actual: Admin login only shows "Family Tree" — all other functional buttons/nav are missing. Both desktop and mobile affected.
errors: none — silent regression (UI renders but without shell)
reproduction: Log in as admin → admin dashboard → only Family Tree visible, no other nav/action buttons
started: After layout.tsx was restored from a gutted stub state

## Eliminated

- hypothesis: AppHeader.tsx has broken role-based rendering
  evidence: AppHeader.tsx is correct — it renders admin nav when isAdminView=true, but it's never mounted because layout.tsx doesn't render LayoutClient/AppShell
  timestamp: 2026-05-02T00:00:00Z

- hypothesis: src/app/admin/layout.tsx missing or broken
  evidence: File does not exist — admin layout is handled by AppShell via pathname check, not a separate layout file
  timestamp: 2026-05-02T00:00:00Z

- hypothesis: AdminSidebar.tsx has broken nav links
  evidence: AdminSidebar.tsx is intact with all nav items (Dashboard, Approvals, Help Inbox, All Members, Generation Seed, Permissions, Approval Scopes, Audit Log, Settings)
  timestamp: 2026-05-02T00:00:00Z

## Evidence

- timestamp: 2026-05-02T00:00:00Z
  checked: src/app/layout.tsx
  found: layout.tsx only imports globals.css and renders bare <html><body>{children}</body></html> — no LayoutClient, no AppShell, no AppHeader anywhere
  implication: ZERO shell is rendered for any page — no header, no sidebar, no nav

- timestamp: 2026-05-02T00:00:00Z
  checked: src/components/LayoutClient.tsx
  found: LayoutClient wraps AppShell + ErrorBoundary + InstallPrompt — this is the correct client-side shell wrapper designed for the root layout
  implication: layout.tsx should wrap {children} in <LayoutClient> to restore all shell behavior

- timestamp: 2026-05-02T00:00:00Z
  checked: src/components/AppShell.tsx
  found: AppShell checks pathname — if /admin/* renders AppHeader (isAdminView) + AdminSidebar (desktop fixed + mobile drawer) + main content. If /, /login, /signup — bare layout. Otherwise standard member layout with AppHeader + MobileBottomNav.
  implication: The entire admin sidebar + header system works correctly IF AppShell is mounted, which requires LayoutClient in layout.tsx

- timestamp: 2026-05-02T00:00:00Z
  checked: src/components/admin/AdminSidebar.tsx
  found: Full NAV array with 9 links: Dashboard, Approvals, Help Inbox, All Members, Generation Seed, Permissions, Approval Scopes, Audit Log, Settings
  implication: Sidebar is fully functional; just never rendered because LayoutClient was dropped from layout.tsx

## Resolution

root_cause: layout.tsx restore dropped the LayoutClient import and its wrapping of {children}. LayoutClient → AppShell → AdminSidebar/AppHeader chain was severed at the root, causing all pages to render without any chrome (no header, no sidebar, no admin nav).
fix: Add LayoutClient import to layout.tsx and wrap {children} in <LayoutClient> inside <body>
verification: fix applied — layout.tsx now imports and renders LayoutClient wrapping {children}; awaiting user confirmation
files_changed: [src/app/layout.tsx]
