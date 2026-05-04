# Fam Project - Context & Hydration Error Report

## Project Overview
**Fam** is a family tree/genealogy management application built with:
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript with `'use client'` directives for client components
- **UI**: Custom glass-morphism design with Tailwind CSS
- **Icons**: lucide-react (with some inline SVG replacements to avoid hydration crashes)
- **State**: React hooks (useState, useEffect, useMemo, useCallback)

## Project Structure
```
src/
├── app/
│   ├── admin/
│   │   ├── approvals/page.tsx
│   │   ├── members/page.tsx
│   │   └── page.tsx (dashboard)
│   ├── api/
│   ├── search/page.tsx
│   └── tree/
│       └── page.tsx
├── components/
│   ├── admin/AdminSidebar.tsx
│   ├── tree/
│   │   ├── DesktopTree.tsx
│   │   └── MobileTree.tsx
│   ├── AppHeader.tsx
│   ├── MobileBottomNav.tsx
│   └── LineagePicker.tsx
└── lib/
```

## The Hydration/Runtime Error

### Symptoms
- Runtime errors related to `clsx` library usage
- Hydration mismatches between server and client rendering
- Error: `import { clsx } from 'clsx'` - incorrect named import

### Root Cause Identified
The `clsx` library **only supports default exports**, but code was using named imports:
```typescript
// WRONG - causes runtime errors
import { clsx } from 'clsx';

// CORRECT
import clsx from 'clsx';
// OR just use template literals instead
```

## Fixes Applied (Commit Required)

### 1. Removed All `clsx` Imports
Deleted `import { clsx } from 'clsx'` from 9 files:
- `src/components/admin/AdminSidebar.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/app/admin/approvals/page.tsx`
- `src/components/tree/DesktopTree.tsx`
- `src/app/tree/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/members/page.tsx`
- `src/app/search/page.tsx`
- `src/components/LineagePicker.tsx`

### 2. Replaced `clsx()` Calls with Template Literals
Changed patterns like:
```typescript
// OLD
className={clsx('base-class', condition ? 'text-white' : 'hover:bg-white/5')}

// NEW
className={`base-class ${condition ? 'text-white' : 'hover:bg-white/5'}`}
```

### 3. Cleared Build Cache
- Deleted `.next` directory completely
- Restarted dev server with `npm run dev`

## Actual TypeScript Errors (from `tsc --noEmit`)

### Error Summary: 13 errors in 5 files

#### 1. Missing `@/lib/db` module (3 errors)
```
src/app/api/members/route.ts:2 - TS2307: Cannot find module '@/lib/db'
src/app/api/export/route.ts:2 - TS2307: Cannot find module '@/lib/db'
src/app/api/test-db/route.ts:2 - TS2307: Cannot find module '@/lib/db'
```
**Fix needed**: Create `src/lib/db.ts` or configure path aliases in `tsconfig.json`

#### 2. Implicit `any` types (8 errors)
```
src/app/api/members/route.ts - Parameters 'm' implicitly have 'any' type (5 errors)
src/app/api/export/route.ts - Parameters 'm' implicitly have 'any' type (3 errors)
```
**Fix needed**: Add proper type annotations

#### 3. Missing `@xyflow/react` type declarations (2 errors)
```
src/components/_RelationshipPreviewInner.tsx:2 - TS7016: Cannot find declaration file for '@xyflow/react'
src/components/tree/_MobileTreeInner.tsx:3 - TS7016: Cannot find declaration file for '@xyflow/react'
```
**Fix options**:
- `npm i --save-dev @types/xyflow__react`
- Or create `declarations/xyflow-react.d.ts` with: `declare module '@xyflow/react';`

### Dynamic Imports in `MobileTree.tsx`
This file uses Next.js `dynamic()` with `@xyflow/react`:
```typescript
const ReactFlow = dynamic(
  () => import('@xyflow/react').then(mod => ({ default: mod.ReactFlow })),
  { ssr: false }
);
```
**Note**: The `.then(mod => ({ default: mod.X }))` pattern is correct for re-mapping named exports to default.

## Questions for LLM / Error Fixing Strategy

1. **Are there any circular import issues** between:
   - `DesktopTree.tsx` ↔ `MobileTree.tsx` ↔ tree layout utilities?
   - Admin components ↔ API routes?

2. **Is the dynamic() import pattern correct** for `@xyflow/react`?
   - Should it be `mod.ReactFlow` or just `mod.default`?
   - Any known issues with `@xyflow/react` and Next.js App Router?

3. **Hydration mismatch detection** - What's the best strategy to:
   - Identify which component is causing the mismatch?
   - Debug server-rendered HTML vs client-rendered HTML?

4. **Next.js 14 specific** - Are there known issues with:
   - `'use client'` directives and dynamic imports?
   - CSS-in-JS libraries causing hydration issues?
   - Tailwind class merging (we replaced clsx, but is there something else)?

## Next Steps After Review
1. Test from fresh browser load (incognito/private window)
2. Check browser console for remaining errors
3. If error persists, provide full error stack trace
4. Consider adding React strict mode checks
5. Verify all client components have proper `'use client'` directives

## Environment
- **OS**: Windows 11
- **Node**: (check with `node --version`)
- **Next.js**: 14.x (App Router)
- **Tailwind**: (version in package.json)
- **clsx**: REMOVED from codebase

---
*Generated: 2026-04-30*
*Status: Build cache cleared, dev server restarted, clsx imports removed*
