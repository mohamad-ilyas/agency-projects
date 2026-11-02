---
description: Build a small app fast with a lean AI team (spec → build → design & content review → tests → independent review → COO release), report every step to the CEO's dashboard, and deliver the live result.
argument-hint: <what the app should do>
---

The CEO's request (brought to the company by Charlotte, COO):

$ARGUMENTS

Use this for small apps and prototypes (a todo app, a landing page, a calculator). Real client projects use `/new-project`.

**All rules in `.claude/commands/new-project.md` apply** — read its "Ground rules" first: right repository (`agency-projects`, which is PUBLIC: no secrets, no confidential client material, codenames), $0, the two approval levels, only Charlotte addresses the CEO, honesty about what was run, branch `project/<key>`, never push to `main`, report after every step (commit report files). You coordinate; each step is done by the named employee's subagent (Task/Agent tool, `subagent_type` = slug), who first reads `playbooks/<slug>.md` if it exists.

## Lean team

| Task key | Owner | Depends on | Reviewer |
|---|---|---|---|
| `<key>/spec` | business-analyst (EMP-002 Oliver) | — | project-manager (EMP-003) |
| `<key>/build` | frontend-engineer (EMP-008 Emily); mobile-engineer (EMP-007) only if a phone app is requested | spec | tech-lead (EMP-006) |
| `<key>/design-review` | design-architect (EMP-015 Alexander) | build | — (design authority) |
| `<key>/content-review` | content-creator (EMP-014 Edward) | build | — (content authority) |
| `<key>/tests` | qa-automation (EMP-012 George) | design-review, content-review | qa-manager (EMP-010) |
| `<key>/review` | quality-reviewer (EMP-013 Eleanor) | tests | — (independent) |
| `<key>/release` — protectedAction `production_deployment` | coo (EMP-001 Charlotte) | review | — (the COO decides) |

## Steps

0. **Set up** (Sarah). Pick a short key (`todo-app`). Create `projects/<key>/PROJECT.md` with the checklist above. Report 1: `project.upsert` (status `development`, `repoUrl` = `https://github.com/mohamad-ilyas/agency-projects/tree/project/<key>/projects/<key>`) plus the seven `task.upsert`s.
1. **Spec** (Oliver): `projects/<key>/docs/spec.md`, at most one page — user stories with Given/When/Then, Arabic (RTL) + English if it has a UI, what is out of scope. Reviewed by Sarah. Report.
2. **Build** (Emily): `projects/<key>/app` with **Vite + React + TypeScript** (`npm create vite@latest app -- --template react-ts`).
   - Implement every story; semantic, keyboard-accessible HTML; RTL-correct with a language switch when bilingual; data in `localStorage` unless the spec needs more.
   - `vite.config.ts`: `base: process.env.BASE_PATH ?? "/"` (releases are served from a sub-path).
   - `package.json` scripts: `"test": "vitest run"`, `"build:preview": "tsc -b && vite build"`. Commit `package-lock.json`.
   - Run `npm install` and `npm run build:preview`; record the real output. Reviewed by James. Report.
3. **Design review** (Alexander) and **content review** (Edward), in parallel: each writes findings to `projects/<key>/docs/design-review.md` / `content-review.md` (location · issue · why · change · severity). Changes go back to Emily, who fixes them; repeat until each approves. Report.
4. **Tests & CI** (George): Vitest + Testing Library tests for each acceptance criterion; `.github/workflows/<key>.yml` on push to `project/<key>`, path-filtered to `projects/<key>/**`, running `npm ci`, `npm test`, `npm run build:preview` in `projects/<key>/app`. Run the tests and record the real output. Reviewed by Victoria. Report.
5. **Independent review** (Eleanor): `projects/<key>/docs/review.md` — claims vs evidence for each acceptance criterion, re-run tests and build, findings with severity, and a line `Verdict: Go`, `Verdict: Go with conditions`, or `Verdict: No-go`. Report.
6. **Release decision** (Charlotte): as in `/new-project` stage 9 — read the evidence; on approval commit `projects/<key>/release.json` and send the report with `approval.decide`; on rejection send the work back. The Release workflow merges, deploys to `https://mohamad-ilyas.github.io/agency-projects/<key>/`, and reports the live link to the CEO.

## Final message to the CEO (Charlotte)

As in `/new-project`: outcome, where it will be live and when (the Release workflow publishes within ~15 minutes of the approval), what was verified, open risks, and only CEO-level decisions (urgent ones marked URGENT).
