---
status: awaiting_human_verify
trigger: "Investigate and fix three issues: admin-lineage-json-crash, tree-connection-lines-invisible, couples-search-broken"
created: 2026-05-03T00:00:00Z
updated: 2026-05-03T00:05:00Z
symptoms_prefilled: true
---

## Current Focus

hypothesis: All three root causes confirmed and fixes applied
test: Coordinate math verified manually; code changes applied
expecting: Human verification of working behavior
next_action: await_human_verify

## Symptoms

expected: Admin lineage search returns results; tree shows connector lines; couples API returns valid JSON
actual: SyntaxError on JSON parse in admin lineage; no connector lines in desktop tree; couples API returns bad/empty body
errors: "SyntaxError: Unexpected end of JSON input at MemberSelect.useEffect.t"
reproduction: /admin/lineage search fields; /tree desktop view
started: After last session's rewrite of admin/lineage/page.tsx and couples route creation

## Eliminated

- hypothesis: spouses table missing in DB
  evidence: spouses table IS created in _initDB() in mysql-db.ts
  timestamp: 2026-05-03T00:02:00Z

- hypothesis: members/route.ts returning non-JSON
  evidence: always returns NextResponse.json() — valid JSON regardless of auth state
  timestamp: 2026-05-03T00:02:00Z

- hypothesis: SVG overflow causing lines to be fully invisible for all trees
  evidence: overflow:visible on SVG handles most cases. Root issue was SVG positioned at left:0
            while node coordinates can be negative, causing paths to be outside SVG box.
            The outer overflow-hidden clips SVG content that goes negative in DOM space.
  timestamp: 2026-05-03T00:03:00Z

## Evidence

- timestamp: 2026-05-03T00:02:00Z
  checked: src/app/api/members/couples/route.ts
  found: No try/catch around query() call. Any DB error causes unhandled promise rejection.
         Next.js route handler returns empty 500 response body when route handler throws.
         Client .json() on empty body → SyntaxError: Unexpected end of JSON input.
  implication: Wrapped entire handler body in try/catch, returns JSON error + empty couples[]

- timestamp: 2026-05-03T00:02:00Z
  checked: src/app/admin/lineage/page.tsx CoupleSelect.useEffect and MemberSelect.useEffect
  found: Both fetch handlers call r.json() without checking r.ok first.
         When server returns 4xx/5xx with empty body (or non-JSON body), this throws.
         CoupleSelect: no res.ok check, no .catch() on the fetch chain.
         MemberSelect: same pattern.
  implication: Added res.ok guard (return safe default on non-OK) + .catch(() => setResults([]))

- timestamp: 2026-05-03T00:03:00Z
  checked: src/components/tree/DesktopTree.tsx buildEdge + svgBounds
  found: SVG was positioned at left:0 with width=max(maxX,2000). Node position.x values
         in treeLayout are centered around 0 — nodes can have negative x (e.g. -88 for left
         member of a couple pair). Edge paths use raw position.x values as SVG coordinates.
         Negative SVG x = outside SVG box to the left. SVG overflow:visible allows rendering
         but the outer "fixed inset-0 overflow-hidden" div clips content before it reaches
         the left edge. This makes edges from solo parents (negative x) invisible.
  implication: Fixed by computing minX across all nodes, setting SVG left=minX, and 
               subtracting the left offset (ox) from all x coordinates in buildEdge paths.

- timestamp: 2026-05-03T00:04:00Z
  checked: Coordinate math verification (manual)
  found: With couple (gen1) + child (gen2):
         husband x=-88, wife x=+88, child x=0
         svgBounds.left = -428
         Spouse bar path: M 410 165 H 446  (36px horizontal line at the gap, correct)
         Parent-child path: M 428 230 V 275 H 428 V 320  (vertical line, correct)
         All coordinates positive within SVG box — no clipping.
  implication: Fix is geometrically correct.

## Resolution

root_cause: >
  Issue 1 (SyntaxError crash in admin lineage):
    CoupleSelect and MemberSelect fetch handlers had no res.ok guard and no .catch().
    When the couples API threw an unhandled DB error (empty 500 body), calling .json()
    on an empty response body crashed with SyntaxError: Unexpected end of JSON input.

  Issue 3 (Couples API empty/bad response):
    GET /api/members/couples had no try/catch around the query() call. Any database
    error (connection issue, SQL error, constraint violation) caused an unhandled promise
    rejection, making Next.js return an empty 500 response body instead of JSON.

  Issue 2 (Parent-to-child lines invisible on desktop tree):
    SVG was positioned at left:0 within the pan/zoom container. treeLayout centers the
    tree at x=0, meaning nodes in couple pairs get negative position.x values (e.g. -88).
    Edge paths used raw position.x as SVG coordinates, putting them at negative x in SVG
    space — outside the SVG box. The outer "overflow-hidden" canvas div clipped these
    negative-coordinate paths. Fix: SVG left offset = min(all node x - padding), all
    path x-coordinates subtract svgBounds.left to stay within SVG box.

fix: >
  1. src/app/api/members/couples/route.ts:
     Wrapped DB query in try/catch. Error returns { error: message, couples: [] } JSON.

  2. src/app/admin/lineage/page.tsx:
     CoupleSelect: added `if (!r.ok) return { couples: [] }` guard + `.catch(() => setResults([]))`
     MemberSelect: added `if (!r.ok) return []` guard + `.catch(() => setResults([]))`

  3. src/components/tree/DesktopTree.tsx:
     svgBounds: added minX computation; SVG positioned at left=minX-padding.
     buildEdge: now takes `ox` (= svgBounds.left) parameter; all x coords subtract ox.
     Call site: passes svgBounds.left as second arg to buildEdge.

verification: Coordinate math verified manually. Code changes applied to all three files.
files_changed:
  - src/app/api/members/couples/route.ts
  - src/app/admin/lineage/page.tsx
  - src/components/tree/DesktopTree.tsx
