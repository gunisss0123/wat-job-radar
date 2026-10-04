# Agency fee verification plan

Goal: correct the eight-agency fee page with inspectable official evidence as of 4 October 2026.

Design: preserve the detail, comparison and refund tabs. Replace unsupported numeric defaults with explicit unknown facts. Each published fact records its source, scope and check date. Separate government fees from amounts billed by agencies. Budget totals require a user-entered net quote and explicit fee inclusion; never average promotional price ranges or assume discounts stack.

- [x] Inspect static fee data, UI and the eight official agency sites.
- [x] Verify current government MRV and SWT SEVIS fees against State Department and eCFR.
- [x] Collect ALC sponsor labels from all four public API pages; retain labels and sample job links without inferring a program year.
- [x] Run failing budget regression tests with `node --import tsx --test scripts/fees.test.ts` (six expected failures before the fix).
- [x] Replace `lib/feesData.ts` with source-backed facts and a quote-based calculation.
- [x] Update `components/FeeCalculator.tsx` to render evidence and unknown fields across all three tabs, and avoid publishing incomplete totals.
- [x] Save an audit explaining unsupported claims and remaining gaps. Inspect iHappy official promotion images and save original URL/hash manifest.
- [x] Run regression tests (7/7 pass), `npm run typecheck`, and `npm run build` (exit 0); inspect all three tabs in `/fees`, inclusion calculation and agency-switch reset. Independent review found no actionable issues and rechecked iHappy posters and all ALC API pages.

No new dependencies, automatic discount stacking, live-data claim, or extrapolation from 2026 prices to 2027. Keep existing checkout and do not deploy.
