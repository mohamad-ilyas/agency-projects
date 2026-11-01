# todo-app — Automated test report

Author: EMP-012 George (QA Automation) · Date: 2026-11-01 · Branch: `project/todo-app` · Spec: `docs/spec.md`

Scope: Vitest 5.0.5 + Testing Library (user-event, role/label queries) in jsdom. These are component-level acceptance
tests of the React app (`<App />` rendered for real; only browser APIs jsdom lacks or that must fail are mocked:
`matchMedia`, `navigator.language`, `localStorage` failures, and the clock for overdue/date cases).

## Result

**95 tests, 95 passed, 0 failed, 0 skipped** (12 files: 10 new acceptance test files plus the 2 existing smoke files; 85 new tests + 10 existing).
Every acceptance criterion AC-1.1 .. AC-9.2 has at least one test whose name starts with its AC ID.

Stability: 3 consecutive `npm test` runs passed (95/95 each). Extra determinism checks, also all 95/95:
`TZ=Pacific/Kiritimati`, `TZ=America/Los_Angeles`, `TZ=Asia/Riyadh`, and `--sequence.shuffle` with seeds 12345 and 987.
No retries, no sleeps; dates are fixed with `vi.useFakeTimers({ toFake: ['Date'] })`.

## Commands and real output (local, Node v22.23.4; CI uses Node 24)

Run in `projects/todo-app/app`:

```text
$ npm ci
added 110 packages, and audited 111 packages in 4s
found 0 vulnerabilities

$ npm test            # run 1 (after review fix, see Revision below)
 Test Files  12 passed (12)
      Tests  95 passed (95)
   Duration  8.07s
$ npm test            # run 2
 Test Files  12 passed (12)
      Tests  95 passed (95)
   Duration  7.99s
$ npm test            # run 3
 Test Files  12 passed (12)
      Tests  95 passed (95)
   Duration  7.95s

$ npm run build:preview
> tsc -b && vite build
vite v8.3.5 building client environment for production...
✓ 23 modules transformed.
dist/index.html                   2.16 kB │ gzip:  0.92 kB
dist/assets/index-C-LfQqYO.css    6.88 kB │ gzip:  1.91 kB
dist/assets/index-CFC9JKGP.js   232.93 kB │ gzip: 73.15 kB
✓ built in 571ms
```

Also run: `npx tsc -b` (test files are type-checked as part of `src`) — no errors; `npx oxlint` — exit 0.

## AC → test traceability

All files are under `projects/todo-app/app/src/`. All results: **pass** (3/3 runs).

| AC | File | Tests (names abbreviated) |
|---|---|---|
| AC-1.1 | test/us1-add.test.tsx | Enter adds trimmed task, clears input, keeps focus (en) · Add button adds trimmed task, returns focus (en) · adds a task in Arabic · (A-4) newest first. Also App.test.tsx smoke |
| AC-1.2 | test/us1-add.test.tsx | empty and whitespace-only titles create no task and announce an error (role=alert, aria-invalid, described-by) (en) · Arabic error message (ar) |
| AC-1.3 | test/us1-add.test.tsx | picked date shown "Due March 5, 2026" and date input cleared (en) · Arabic "تستحق في 5 مارس 2026", Western digits only (ar) · no date picked → no date shown |
| AC-2.1 | test/us2-complete.test.tsx | ticking marks done (checkbox checked, `task--done` class) and count −1 (en) · keyboard Space + Arabic count 3 → 2 (ar) |
| AC-2.2 | test/us2-complete.test.tsx | unticking → active, count +1, stored done=false · (A-4) toggling does not reorder |
| AC-3.1 | test/us3-edit.test.tsx | Edit title + date, Save button → shown, stored, focus returns to Edit (en) · Enter saves (ar) |
| AC-3.2 | test/us3-edit.test.tsx | Escape cancels, title and date kept, focus returns (en) · Cancel button keeps original, re-open starts from original (ar) |
| AC-3.3 | test/us3-edit.test.tsx | whitespace title refused (alert, aria-invalid, focus), original kept · clearing due date allowed |
| AC-4.1 | test/us4-delete.test.tsx | removed from list + storage, count updates, deletion announced, focus to list heading (en) · last task → empty state, "لا توجد مهام متبقية" (ar) · deleting a done task leaves count unchanged |
| AC-5.1 | test/us5-filter.test.tsx | All/Active/Done show matching tasks, `aria-pressed` true only on selected (en) · ticking under Active removes it from view (ar) |
| AC-5.2 | test/us5-filter.test.tsx | empty-state texts for All/Active/Done (en) · same in Arabic, and the text follows a language switch |
| AC-6.1 | test/us6-count.test.tsx | English 0/1/2/11/100/101 (6 cases) · footer ignores the filter, `aria-live="polite"` in footer · "1 task left" → "0 tasks left" |
| AC-6.2 | test/us6-count.test.tsx | Arabic category + text for 0,1,2,3,10,11,99,100,101,103,111 (11 cases) · footer renders Arabic form for 0,1,2,3,11,100 active tasks (6 cases) |
| AC-7.1 | test/us7-language.test.tsx | Arabic: all UI chrome Arabic, `<html lang="ar" dir="rtl">`, `document.title` · English: `<html lang="en" dir="ltr">` · titles use `dir="auto"` |
| AC-7.2 | test/us7-language.test.tsx | choice saved (`todo-app:v1:lang`) and used after reload · saved "en" beats Arabic browser |
| AC-7.3 | test/us7-language.test.tsx | navigator.language "ar", "ar-SA", "AR-eg" → ar/rtl; "en-US", "fr-FR", "" → en/ltr; nothing saved (6 cases) · invalid saved value falls back to browser |
| AC-8.1 | test/us8-theme.test.tsx | system dark → `data-theme="dark"`, toggle pressed · system light · live system change followed · no matchMedia → light, no crash |
| AC-8.2 | test/us8-theme.test.tsx | toggle applies immediately, saved, survives reload (en) · back to light beats dark system after reload (ar) · system changes ignored after a user choice · toggle by keyboard Enter |
| AC-9.1 | test/us9-persistence.test.tsx | add + edit + toggle + delete, then reload → identical titles, dates, done state, order, stored JSON · versioned keys `todo-app:v1:*` |
| AC-9.2 | test/us9-persistence.test.tsx | empty storage → empty list, no notice · corrupt data (invalid JSON, object, null, number) → empty list · partially corrupt → only valid tasks · storage unavailable (setItem throws) → notice, app still usable (en) · `window.localStorage` getter throws SecurityError → Arabic notice · write failed (quota) → write-failed notice, clears after next successful save · write-failed notice in Arabic |
| A-5 (assumption) | test/a5-overdue.test.tsx | past-due active task shows "Overdue" text (not colour only); today/future/done not overdue (en) · Arabic "متأخرة", removed on completion (ar) |

Tech-lead gap list → covered: delete (AC-4.1), theme toggle + persistence + system default with mocked matchMedia
(AC-8.1/8.2), storage-unavailable and write-failed notices with throwing localStorage (AC-9.2), filter empty-state texts
(AC-5.2), first-visit language with mocked navigator.language (AC-7.3), corrupt-data load (AC-9.2), Arabic plural for
0,1,2,3,11,100,101,103,111 and English singular/plural (AC-6.1/6.2), `<html lang/dir>` after switching (AC-7.1).

Arabic and English paths are both covered for every story.

## Not covered by this automation (needs manual / device testing)

- **Real iPhone / Safari (WebKit)**: jsdom is not a browser. Not covered: iOS date picker, input zoom (16px rule),
  safe-area insets / `viewport-fit=cover`, 320px layout without horizontal scroll, 44×44px touch targets,
  Safari private-mode storage behaviour on a real device, the pre-paint script in `index.html` (runs before React; jsdom tests do not load `index.html`).
- **Visual styling**: CSS is not loaded in jsdom (`css: false`). Done-state strikethrough/muted is asserted only via the
  `task--done` class; the rule itself (`index.css` `.task--done .task__title { text-decoration: line-through; color: var(--color-muted) }`) was read, not rendered. RTL mirroring/logical properties (NFR-1), focus-ring visibility, `prefers-reduced-motion` not tested.
- **VoiceOver / screen readers**: tests check roles, accessible names, `aria-live`, `aria-pressed`, `role=alert`, but not real announcements.
- **Contrast measurement** (WCAG 2.1 AA, both themes): not measured.
- **Performance** (NFR-5: ~2 s first load on 4G, <100 ms with 500 tasks): not measured.
- **Browser E2E** (Playwright): not set up in this pass; recommended next step for the critical journeys in Chromium + WebKit.

## Defects found

**No product defects found.** All acceptance criteria behave as specified in the tested environment.

Spec note (not a code defect; for EMP-002 Oliver, spec owner): AC-6.2 says "100+ → other". CLDR (and the app, via
`Intl.PluralRules`) uses n % 100, so 101 → other but 103 → few ("103 مهام متبقية") and 111 → many ("111 مهمة متبقية").
The tests assert the CLDR behaviour, which matches the AC's own phrase "all six CLDR plural categories". Suggest
rewording the shorthand in the spec.

## Revision (review by EMP-010 Victoria)

Low finding fixed: in `a5-overdue.test.tsx` the Arabic task title "متأخرة جداً" contained the badge word "متأخرة",
so `toHaveTextContent('متأخرة')` on the row could never fail. The title is now "دفع الفاتورة", the `.badge` check is kept,
and a check was added that the row no longer contains "متأخرة" after completion. Test count unchanged (95);
re-run 3 times, 95/95 each (output above). The earlier timezone/shuffle runs were done before this fix and were not repeated.

## CI

`.github/workflows/todo-app.yml` ("todo-app CI"): push to `project/todo-app` and pull_request (paths
`projects/todo-app/**`, the workflow file), plus workflow_dispatch; `permissions: contents: read`; one ubuntu-latest job
(timeout 15 min) running `npm ci`, `npm test`, `npm run build:preview` with Node 24 and npm cache. No secrets used.
Not yet run on GitHub (not pushed); local suite takes about 9 s, so it is well within free-tier minutes.
