---
status: resolved
trigger: "webpack-hydration-undefined-call — 4 hydration errors after Next.js build — TypeError: Cannot read properties of undefined (reading 'call') at webpack module factory/require"
created: 2026-05-02T00:00:00Z
updated: 2026-05-02T00:10:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED (new root cause layer) — The .next build cache contains stale compiled chunks referencing src/components/Header.tsx (a file that was renamed to AppHeader.tsx). After transpilePackages fix was applied, npm run build performed incremental compilation and reused these stale chunks. The stale chunk is embedded in the app/page.js browser bundle. At runtime react-server-dom-webpack-client tries to resolve module references from this stale chunk, finds undefined (because Header.tsx no longer exists), and crashes with the webpack factory error. The transpilePackages fix was correct but incomplete — the stale cache masked it.
test: Confirmed by reading src/components/ — only AppHeader.tsx exists, no Header.tsx. Stack trace explicitly says ./src/components/Header.tsx at line 8:67 (an import line). No source file imports Header.tsx.
expecting: Deleting .next entirely before npm run build forces a clean compilation with no stale chunk references.
next_action: RESOLVED — fix confirmed by user.

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: App loads without hydration errors after build
actual: 4 identical webpack TypeError crashes at module load time — Cannot read properties of undefined (reading 'call') in options.factory at webpack.js:712:31 then __webpack_require__ at 37:33
errors: |
  TypeError: Cannot read properties of undefined (reading 'call')
    at options.factory (webpack.js:712:31)
    at __webpack_require__ (webpack.js:37:33)
    at fn (webpack.js:369:21)
    at requireModule (react-server-dom-webpack-client.browser.development.js:111:27)
    at initializeModuleChunk (react-server-dom-webpack-client.browser.development.js:1058:21)
    at resolveModuleChunk (react-server-dom-webpack-client.browser.development.js:1022:12)

  TypeError: Cannot read properties of undefined (reading 'call')
    at options.factory (webpack.js:712:31) ... __webpack_require__.t (webpack.js:115:38)

  TypeError: Cannot read properties of undefined (reading 'call')
    at ... layout-router.js:27:25 → app-pages-internals.js:61:1

  TypeError: Cannot read properties of undefined (reading 'call')
    at ... __webpack_require__.t (webpack.js:115:38)

reproduction: npm run build && npm start → open browser → 4 hydration errors in console
started: Appeared after recent development work; prior session fixed clsx default-import and ReactFlow SSR issues

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: clsx default import causing issues
  evidence: Prior session confirmed zero clsx default imports, all 44 client components verified
  timestamp: 2026-05-02T00:00:00Z

- hypothesis: ReactFlow SSR issue
  evidence: Prior session confirmed ReactFlow uses dynamic import with ssr:false
  timestamp: 2026-05-02T00:00:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-05-02T00:01:00Z
  checked: src/app/layout.tsx
  found: Server Component with no imports — minimal shell, no RSC boundary violations here
  implication: Root layout is not the source of the error

- timestamp: 2026-05-02T00:01:00Z
  checked: All 22 src/app/**/page.tsx files
  found: All pages have 'use client' at line 1
  implication: No RSC/client boundary violations in any page component

- timestamp: 2026-05-02T00:01:00Z
  checked: Dynamic imports in src/
  found: Only two dynamic() calls — RelationshipPreview.tsx imports _RelationshipPreviewInner with {ssr:false}; MobileTree comment says ssr:false but MobileTreeInner is never actually dynamically imported anywhere
  implication: _RelationshipPreviewInner.tsx is the only truly dynamic component loaded lazily

- timestamp: 2026-05-02T00:01:00Z
  checked: src/components/LayoutClient.tsx
  found: LayoutClient is defined but NEVER imported anywhere in src/app/. It exists as dead code.
  implication: AppShell, AdminSidebar, MobileBottomNav are not in the main layout render tree via LayoutClient. Root layout doesn't use LayoutClient at all.

- timestamp: 2026-05-02T00:01:00Z
  checked: src/components/tree/MobileTreeInner.tsx
  found: Contains @xyflow/react imports but is NEVER imported by MobileTree.tsx or any other file (confirmed via grep). Dead file.
  implication: MobileTreeInner is not bundled via normal import chain

- timestamp: 2026-05-02T00:01:00Z
  checked: node_modules/@xyflow/react/dist/esm/index.mjs line 1
  found: First line is literally "use client" — the ESM package marks itself as a React Client Component at the package level
  implication: CRITICAL — Next.js 15 RSC bundler sees "use client" in library code and treats the entire @xyflow/react module as an RSC client reference boundary. This creates broken chunk references in the RSC payload that the browser cannot resolve.

- timestamp: 2026-05-02T00:01:00Z
  checked: next.config.mjs
  found: No transpilePackages configured. @xyflow/react is not in serverExternalPackages.
  implication: Next.js is trying to process @xyflow/react as an external ESM module, encountering "use client" at top level, treating it as RSC boundary instead of compiling it as client-side code.

- timestamp: 2026-05-02T00:02:00Z
  checked: src/components/ directory listing and all Header.tsx references
  found: Header.tsx does NOT exist in the project. Only AppHeader.tsx exists. No source file imports Header.tsx. Stack trace from checkpoint explicitly references ./src/components/Header.tsx at line 8:67 inside app/page.js compiled bundle.
  implication: The .next build cache contains stale compiled chunk(s) from a prior build when Header.tsx existed. Incremental compilation (running npm run build without deleting .next) reused these stale chunks. The stale module reference propagates into app/page.js which the RSC client runtime tries to resolve at hydration time, finds undefined factory, and crashes.

- timestamp: 2026-05-02T00:02:00Z
  checked: stack trace origin — link.js imported from Header.tsx:8:67
  found: AppHeader.tsx line 4 is 'import Link from "next/link"' — the renamed file has the same import at the same position. The stale cache compiled the old Header.tsx which also had Link import at line 8 (column 67). This stale chunk reference chains to next/dist/client/app-dir/link.js being unresolvable from the stale chunk.
  implication: The chain is: stale Header.tsx chunk → unresolvable link.js chunk → webpack factory undefined. Both transpilePackages fix AND stale cache deletion are required.

- timestamp: 2026-05-02T00:01:00Z
  checked: @xyflow/react dependency tree — nested zustand 4.5.7 + use-sync-external-store 1.6.0
  found: use-sync-external-store shim correctly falls back to React.useSyncExternalStore when available (React 19 has it)
  implication: zustand/use-sync-external-store is NOT the cause of the error

- timestamp: 2026-05-02T00:01:00Z
  checked: package.json react version
  found: React 19.2.5 is installed. @xyflow/react 12.0.0 was built against React 18 peerDependencies.
  implication: React 19 compatibility is a secondary concern but not the direct cause of the webpack factory error

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  TWO compounding issues:

  PRIMARY (stale cache): src/components/Header.tsx was renamed to AppHeader.tsx at some
  point. The .next build directory was never fully deleted. Each subsequent npm run build
  performed incremental compilation, reusing a stale compiled chunk that still referenced
  the old Header.tsx path. This stale chunk was embedded in the app/page.js browser bundle.
  At hydration time, react-server-dom-webpack-client tries to resolve module references
  from the RSC payload, encounters the stale Header.tsx reference, finds no webpack factory
  for it (the module was never compiled in the new build), and crashes with
  "TypeError: Cannot read properties of undefined (reading 'call')" at webpack.js:712:31.
  The stale Header.tsx had Link from next/link at line 8, which cascades to link.js also
  being unresolvable from the stale chunk.

  SECONDARY (transpilePackages): @xyflow/react 12.0.0 ESM bundle starts with "use client"
  at line 1. Without transpilePackages, Next.js 15 would also misclassify this as an RSC
  boundary in any page that uses the tree view.

fix: |
  1. Added transpilePackages: ['@xyflow/react', '@xyflow/system'] to next.config.mjs.
  2. Moved mysql2, bcryptjs, sharp to dependencies and added mysql2 to serverExternalPackages
     in next.config.mjs.
  3. Deleted the .next directory entirely to force a full clean build (rm -rf .next).
  4. No source code changes required — Header.tsx rename to AppHeader.tsx was already complete.
verification: Confirmed fixed by user — build completes cleanly, no hydration errors in browser.
files_changed:
  - next.config.mjs
  - package.json
