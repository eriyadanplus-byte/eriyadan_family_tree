---
status: awaiting_human_verify
trigger: "all pages render in a cluttered layout on both desktop and mobile"
created: 2026-05-02T00:00:00Z
updated: 2026-05-02T00:01:00Z
---

## Current Focus

hypothesis: CONFIRMED — layout.tsx lost its globals.css import and all foundational HTML attributes during the recent hydration fix session
test: Read layout.tsx — it contained only a bare html/body wrapper with no imports at all
expecting: Restoring globals.css import + lang + font links + body className fixes all layout
next_action: Human verify — run npm run build && npm start and confirm layout is correct

## Symptoms

expected: Pages render with proper layout — header, content area, spacing, responsive columns all correct
actual: Pages are "cluttered" — visual layout broken on both desktop and mobile views
errors: No JS errors related to layout. Hydration error from browser extension (bis_register) is NOT the cause.
reproduction: npm run build && npm start → open any page → layout is cluttered
started: Appeared around same time as webpack hydration fixes (transpilePackages added, .next cache cleared, package.json deps reorganized)

## Eliminated

- hypothesis: Tailwind content glob missing src/**/*.{ts,tsx}
  evidence: tailwind.config.js content array correctly covers ./src/app/**/*.{js,ts,jsx,tsx,mdx} and ./src/components/**/*.{js,ts,jsx,tsx,mdx}
  timestamp: 2026-05-02T00:01:00Z

- hypothesis: postcss.config.js missing tailwindcss plugin
  evidence: postcss.config.js correctly has tailwindcss: {} and autoprefixer: {}
  timestamp: 2026-05-02T00:01:00Z

- hypothesis: next.config.mjs broke CSS pipeline
  evidence: next.config.mjs has no cssModules or experimental flags; no CSS-related config at all — CSS pipeline is entirely Tailwind/PostCSS standard
  timestamp: 2026-05-02T00:01:00Z

- hypothesis: globals.css missing Tailwind directives
  evidence: globals.css correctly has @tailwind base/components/utilities at top, plus all CSS custom properties and component classes
  timestamp: 2026-05-02T00:01:00Z

## Evidence

- timestamp: 2026-05-02T00:01:00Z
  checked: src/app/layout.tsx
  found: File contained ONLY a bare RootLayout with <html><body>{children}</body></html> — no imports, no lang attribute, no font links, no className on body
  implication: globals.css was never imported → Tailwind generates no styles → all Tailwind classes are no-ops → CSS custom properties undefined → fonts not loaded → complete layout breakdown

- timestamp: 2026-05-02T00:01:00Z
  checked: tailwind.config.js
  found: content array correctly targets src/app and src/components with all TS/TSX/JS/JSX/MDX extensions
  implication: Tailwind purging is configured correctly — the problem was never purging, it was that CSS was never loaded

- timestamp: 2026-05-02T00:01:00Z
  checked: postcss.config.js
  found: tailwindcss and autoprefixer plugins present
  implication: CSS pipeline is intact

- timestamp: 2026-05-02T00:01:00Z
  checked: globals.css
  found: @tailwind base/components/utilities present; all CSS vars, component classes, utility layers all intact
  implication: The CSS file itself is correct and complete

## Resolution

root_cause: src/app/layout.tsx lost its import of globals.css (and all other foundational content) during the recent session that fixed webpack/hydration issues. The file was reduced to a bare 10-line stub with no CSS import, no lang attribute, no font preconnects, and no body className. Without globals.css being imported, Next.js never injects any CSS into the page — Tailwind's output file is never referenced, CSS custom properties never defined, and Google Fonts never loaded. Every component renders with zero styling applied.

fix: Restored layout.tsx with: (1) import './globals.css', (2) Metadata export, (3) html lang="en", (4) Google Fonts preconnect + stylesheet link tags for Fraunces and Inter, (5) body className="font-sans antialiased"

verification: File confirmed correct after edit. Awaiting human verification via npm run build && npm start.

files_changed: [src/app/layout.tsx]
