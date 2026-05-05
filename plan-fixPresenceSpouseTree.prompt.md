## Plan: Fix presence UUID error and spouse tree rendering

TL;DR: Validate session IDs before the Supabase presence update, confirm the `users` table is using UUID IDs, and improve spouse rendering especially in mobile parent-child edge handling.

**Steps**
1. Confirm runtime DB schema and current `users` row IDs.
   - Inspect `db/supabase/schema.sql` and the active Supabase/local database schema for `users.id`.
   - If the runtime DB contains integer IDs like `1`, fix the data migration or use the matching schema.

2. Harden `src/app/api/presence/route.ts`.
   - Validate `session.id` is a UUID-like string before calling `query`.
   - If invalid, return a 400/401 response instead of letting Supabase throw.
   - Add clear logging for invalid session IDs to catch the root cause.

3. Confirm session creation uses stringified IDs.
   - Review `src/app/api/auth/login/route.ts` and any signup/auth code that creates JWTs.
   - Ensure `createToken({ id: String(user.id), ... })` is used consistently.

4. Verify spouse link population in the tree APIs.
   - Review `src/app/api/members/route.ts` and `src/app/api/tree/route.ts`.
   - Confirm the `spouses` table is used to populate symmetric `spouseId` values.
   - Add local debug logging or tests if current spouse pair lookups are missing the newly added spouse.

5. Fix mobile tree parent-child edge rendering.
   - In `src/components/tree/MobileTree.tsx`, detect when a child has both parents and a spouse edge exists.
   - Render the parent-child line from the parents' midpoint rather than only from the father node.
   - This will fix the mobile view line drawing from the father only.

6. Fix any generation/spouse layout edge cases in `src/lib/treeLayout.ts`.
   - Confirm spouse edges are created for same-generation couples.
   - If the spouse is created in a different generation or not in the same group, add a fallback so the spouse relationship still appears.

7. Add regression tests.
   - Extend `src/app/api/__tests__/members.test.ts` or `src/app/api/__tests__/tree.test.ts` for spouse edge population.
   - Add a mobile layout test for parent-child edge start position when both parents exist.

**Verification**
1. Start the app and confirm `POST /api/presence` no longer throws `invalid input syntax for type uuid: "1"`.
2. Add a Gen2 member with spouse and verify the couple appears on both desktop and mobile.
3. Confirm mobile parent-child line starts at the couple midpoint when both parents are present.
4. Run targeted tests covering spouse pair population and mobile edge rendering.

**Decisions**
- The session error is likely caused by invalid/non-UUID `users.id` values in the auth session.
- The mobile line bug is caused by parent-child rendering not accounting for paired parents in the compact layout.
- The spouse non-rendering issue likely stems from API spouse lookup or same-generation layout assumptions.
