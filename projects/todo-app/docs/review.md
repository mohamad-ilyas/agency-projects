# todo-app: Independent quality review

Reviewer: EMP-013 Eleanor Whitfield (independent; I did not contribute to this work) · Date: 2026-11-01
Scope: branch `project/todo-app` at `5a2ec1e`: `docs/spec.md`, `app/` (Vite + React 19 + TS), `docs/test-report.md`, `.github/workflows/todo-app.yml`.

## Recommendation: Go with conditions (for the CEO-approved preview only)

All 20 acceptance criteria are verified by code reading plus passing tests that I re-ran myself. I found no critical, high or medium defects. The conditions are listed at the end. The CEO makes the final decision.

## Commands I ran (local, Node v22.23.4, npm 10.9.9, in `projects/todo-app/app`)

| Command | Real final output |
|---|---|
| `npm ci` | `added 110 packages, and audited 111 packages in 4s` · `found 0 vulnerabilities` (exit 0) |
| `npm test` | `Test Files  12 passed (12)` · `Tests  95 passed (95)` · `Duration  8.81s` (exit 0) |
| `npm run build:preview` | `dist/assets/index-CFC9JKGP.js 232.93 kB │ gzip: 73.15 kB` · `✓ built in 610ms`; assets at `/assets/…` |
| `BASE_PATH=/agency-projects/todo-app/ npm run build:preview` | `✓ built in 348ms`; `dist/index.html` has `src="/agency-projects/todo-app/assets/index-CFC9JKGP.js"`, `href="/agency-projects/todo-app/assets/index-C-LfQqYO.css"`, `href="/agency-projects/todo-app/favicon.svg"` |
| `npm audit --omit=dev` / `npm audit` | `found 0 vulnerabilities` (both) |
| `npm run lint` (oxlint) | no findings, exit 0 |
| `gh run list` (todo-app CI) | success: 41350170846 (d058a06), 41350189576 (963c372), **41350259061 (5a2ec1e, 2026-11-01T21:06:24Z)** |
| Rendered check (Playwright + Chrome 320×640, mobile, en/ar × light/dark, built preview) | `scrollWidth 320 = clientWidth 320` including edit mode and a 90-character unbroken title; all inputs `16px`; only elements under 44px are the 22px checkboxes, which sit inside a 44×44 `<label>` target; RTL mirrors (checkbox on the right); 0 console errors; 0 requests to other origins |

## Claims vs evidence

"Claimed" refers to `test-report.md`. Test names start with the AC ID. All files are under `app/src/`.

| AC | Code evidence | Test evidence (re-run, passing) | Verdict |
|---|---|---|---|
| 1.1 trim, clear, focus | `AddTaskForm.tsx` handleSubmit; `tasks.ts` normalizeTitle | us1-add: 4 × AC-1.1 | Verified |
| 1.2 empty refused + announced | `AddTaskForm.tsx` role=alert, aria-invalid | us1-add: 2 × AC-1.2 | Verified |
| 1.3 due date shown / none | `TaskItem.tsx` task__due; `i18n.ts` formatDueDate | us1-add: 3 × AC-1.3 | Verified |
| 2.1 / 2.2 toggle + count | reducer `toggle`; `.task--done` CSS (line-through + muted) | us2-complete: 4 | Verified (style read in code; strikethrough not checked in a rendered screenshot) |
| 3.1 / 3.2 / 3.3 edit, cancel, refuse empty | `TaskItem.tsx` save/cancel/Escape; reducer `edit` | us3-edit: 6 | Verified |
| 4.1 delete | reducer `delete`; focus moves to list heading | us4-delete: 3 | Verified |
| 5.1 / 5.2 filters, aria-pressed, empty state | `FilterBar.tsx`; `messages.empty` | us5-filter: 4 | Verified |
| 6.1 English plural | `formatTasksLeft` (Intl.PluralRules) | us6-count: 6 cases + 2 | Verified |
| 6.2 Arabic CLDR plural | `ar.tasksLeft` has all 6 forms | us6-count: 11 + 6 cases | Verified (Node ICU; Safari ICU not run) |
| 7.1 / 7.2 / 7.3 language, html lang/dir, persistence, A-1 default | `App.tsx` effect; `detectLang`; pre-paint script in `index.html` | us7-language: 6 + 6 cases | Verified (pre-paint script exercised only in my Chrome run) |
| 8.1 / 8.2 theme follows system; toggle persists | `theme.ts`, `App.tsx`; pre-paint script | us8-theme: 8 | Verified (matchMedia mocked in jsdom; my Chrome run applied the saved theme) |
| 9.1 restore exactly | `storage.ts` save on every change | us9-persistence: 2 | Verified |
| 9.2 empty/corrupt/unavailable + notice | `storage.ts` try/catch, `isTask` validation, `role=status` notice | us9-persistence: 6 | Verified in jsdom; real Safari private mode not tested |
| A-5 overdue: text + icon, not colour alone | `isOverdue`, badge + `!` icon | a5-overdue: 2 | Verified (also seen rendered) |

NFR checks: **NFR-1** CSS uses logical properties throughout. The only physical names are `env(safe-area-inset-left/right)` (see F-4). `dir="auto"` is set on titles and inputs. **NFR-3** `viewport-fit=cover`, `max(1rem,16px)` inputs, `--tap: 44px`, and safe-area padding are all present. **NFR-4** uses versioned keys and makes no network calls (grep plus the rendered run). **Security:** the branch diff vs merge-base touches only `projects/todo-app/**` and the workflow. I found no secrets, tokens, emails or personal data. There is no `dangerouslySetInnerHTML`/`innerHTML`/`eval`. All titles render as React text, and stored data is validated with `isTask`. The workflow has `permissions: contents: read` and uses no secrets. The two runtime dependencies are react and react-dom.

## Findings

| ID | Severity | Evidence | Expected change (owner) |
|---|---|---|---|
| F-1 | Low | `App.tsx` has no `storage` event listener. With two open tabs, the last write wins and silently discards the other tab's changes. | Listen for `storage` on `todo-app:v1:tasks` and reload state, or document it as a limitation (EMP-008) |
| F-2 | Low | The save effect runs on mount. Entries dropped by `loadTasks` (invalid or unknown shape) are overwritten at once and cannot be recovered. This matches AC-9.2 but is irreversible. | Skip the first save until a change happens, or keep a backup key on parse failure (EMP-008) |
| F-3 | Low | `today = todayISO()` is computed per render, so overdue badges do not update across midnight until the next interaction | Re-render on `visibilitychange` or with a midnight timer (EMP-008) |
| F-4 | Low | `index.css` `.app` maps `padding-inline-start` to `safe-area-inset-left`. In RTL the inline start is the right side, so the insets swap. Impact is minimal because `max-inline-size: 42rem` centres content on landscape iPhones. | Use `padding-left/right` with the physical insets for the safe area only, or swap them under `[dir=rtl]` (EMP-008) |
| F-5 | Low | The language button's accessible name is only "English" / "العربية". `languageSwitchLabel` is defined but unused. | Add context, e.g. `aria-label` "Language: English", or keep the visible name in the label (EMP-008) |
| F-6 | Low (docs) | `test-report.md` CI section still says "Not yet run on GitHub (not pushed)". Three green runs now exist, including 5a2ec1e. The timezone and shuffle runs predate the last test fix (this is disclosed). | Update the CI section with the run IDs (EMP-012) |
| F-7 | Low (process) | CI does not run `npm run lint`. `tsc -b` runs as part of `build:preview`. | Add `npm run lint` to the workflow (EMP-012) |

Informational: `git diff origin/main --stat` also lists `.claude/commands/*`, `deliver-reports.yml` and `docs/agent-report.md`. These differences come from `main` having moved ahead by one commit (6b4e916). The branch does not change those files (checked against the merge-base). The CEO's normal merge is unaffected.

## Not verified (stated honestly)

- **Real iPhone / Safari (WebKit)**: not run. My rendered check used Chrome only. Not checked: iOS input zoom, the native date picker (Chrome shows `mm/dd/yyyy` placeholders under the Arabic UI because they follow the browser locale, not the page), safe-area insets on a notched device, Safari private-mode storage, and the home-screen web-app mode.
- **VoiceOver / screen readers**: not run. Only roles, names and live-region attributes were checked, through tests.
- **Contrast**: CSS token pairs pass AA by calculation (e.g. muted on surface 7.87:1 light and 7.83:1 dark; primary button 6.70:1 and 9.05:1; danger badge 5.75:1 and 7.26:1). Native control rendering (placeholder, checkbox, date picker) and hover/focus states were not measured with a tool.
- **Performance (NFR-5)**: not measured. The bundle is 73 kB gzip. I did not run a 4G or 500-task timing.
- **Keyboard and focus ring in a real browser**: covered only by jsdom tests and code reading.

## Conditions for Go

1. The CEO confirms or amends assumptions **A-1..A-5** (spec status is still "draft"). Any change reopens the affected ACs.
2. The release covers the **CEO-approved preview** (`/agency-projects/todo-app/`, published with `BASE_PATH=/agency-projects/todo-app/`) only. It is labelled "not yet verified on a real iPhone/VoiceOver".
3. Before the team relies on it daily, run a short manual pass on a real iPhone (Safari, both languages and themes, VoiceOver basics, private mode) and record the results with date and device.
4. F-1..F-7 are logged with their owners. None blocks the preview.
