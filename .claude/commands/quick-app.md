---
description: Build a small app fast with a lean AI team (spec → build → tests → review), report every step to the CEO's dashboard, and prepare a preview link for the CEO to publish.
argument-hint: <what the app should do>
---

The CEO's request:

$ARGUMENTS

Use this for small apps and prototypes (a todo app, a landing page, a calculator). Real client projects use `/new-project`.

**All rules in `.claude/commands/new-project.md` apply** — read its "Ground rules" first: right repository (`agency-projects`, which is PUBLIC: no secrets, no confidential client material, codenames), $0, protected actions go to the CEO, honesty about what was run, branch `project/<key>`, never push to `main`, report after every step. You coordinate; each step is done by the named employee's subagent (Task/Agent tool, `subagent_type` = slug).

## Lean team

| Task key | Owner | Depends on | Reviewer |
|---|---|---|---|
| `<key>/spec` | business-analyst (EMP-002 Oliver) | — | project-manager (EMP-003) |
| `<key>/build` | frontend-engineer (EMP-008 Emily); mobile-engineer (EMP-007) only if a phone app is requested | spec | tech-lead (EMP-006) |
| `<key>/tests` | qa-automation (EMP-012 George) | build | qa-manager (EMP-010) |
| `<key>/review` | quality-reviewer (EMP-013 Eleanor) | tests | — (reports to the CEO) |
| `<key>/preview` — protectedAction `public_release` | project-manager (EMP-003 Sarah) | review | — (the CEO decides) |

## Steps

0. **Set up** (Sarah). Pick a short key (`todo-app`). Create `projects/<key>/PROJECT.md` with the checklist above. Report 1: `project.upsert` (status `development`, `repoUrl` = `https://github.com/mohamad-ilyas/agency-projects/tree/project/<key>/projects/<key>`) plus the five `task.upsert`s.
1. **Spec** (Oliver): `projects/<key>/docs/spec.md`, at most one page — user stories with Given/When/Then, Arabic (RTL) + English if it has a UI, what is out of scope. Reviewed by Sarah. Report.
2. **Build** (Emily): `projects/<key>/app` with **Vite + React + TypeScript** (`npm create vite@latest app -- --template react-ts`).
   - Implement every story in the spec; semantic, keyboard-accessible HTML; RTL-correct with a language switch when bilingual; data in `localStorage` unless the spec needs more.
   - `vite.config.ts`: `base: process.env.BASE_PATH ?? "/"` (previews are served from a sub-path).
   - `package.json` scripts: `"test": "vitest run"`, `"build:preview": "tsc -b && vite build"`. Commit `package-lock.json`.
   - Run `npm install` and `npm run build:preview`; record the real output. Reviewed by James. Report.
3. **Tests & CI** (George): Vitest + Testing Library tests for each acceptance criterion; `.github/workflows/<key>.yml` on push to `project/<key>`, path-filtered to `projects/<key>/**`, running `npm ci`, `npm test`, `npm run build:preview` in `projects/<key>/app`. Run the tests and record the real output. Reviewed by Victoria. Report.
4. **Independent review** (Eleanor): `projects/<key>/docs/review.md` — claims vs evidence for each acceptance criterion, re-run tests and build, findings with severity, Go / Go with conditions / No-go. Report (no reviewer on her record).
5. **Preview** (Sarah): do **not** publish. The repository's **Publish previews** workflow builds every `project/*` branch that has a `build:preview` script and serves it at `https://mohamad-ilyas.github.io/agency-projects/<key>/` — only the CEO runs it. Mark `<key>/preview` under review and file `approval.request` (`public_release`, taskKey `<key>/preview`, supporting files: the workflow link `https://github.com/mohamad-ilyas/agency-projects/actions/workflows/publish-previews.yml` and the review). Report.

## Final message to the CEO

A few lines: what was built, the branch, test results, the review verdict, and:
"To see it live: GitHub → agency-projects → **Actions** → **Publish previews** → **Run workflow**, then approve the deployment. It appears at https://mohamad-ilyas.github.io/agency-projects/<key>/ — then approve the preview task in the dashboard's Approval Center."
