# todo-app

| Field | Value |
|---|---|
| Client | Internal — team |
| Key | todo-app |
| Type | Quick app |
| Branch | project/todo-app |
| Repo | https://github.com/mohamad-ilyas/agency-projects/tree/project/todo-app/projects/todo-app |
| Preview | /agency-projects/todo-app/ (published only by the CEO via Actions → Publish previews) |
| Project manager | EMP-003 Sarah Mitchell |

## Request (CEO)

> Build a simple to-do tasks web app for our team in React. Features: add a task with a title and optional due date, mark it done, edit and delete it, filter All / Active / Done, and show how many tasks are left. Arabic (RTL) and English with a language switch, light and dark mode, and it must work well on an iPhone. Save tasks in the browser — no login, no server. Project key: todo-app.

## Assumptions

- Vite + React + TypeScript, static build.
- Tasks persisted in the browser with localStorage; no backend, no login, no accounts.
- $0: no paid services, APIs, or dependencies requiring a subscription.
- Preview served at /agency-projects/todo-app/ (build base path must match).
- Public repository: no secrets, credentials, or personal data in code, fixtures, or screenshots.

## Open questions (unanswered — for the CEO)

1. Default language on first visit: Arabic, English, or follow the browser?
2. Default theme: follow the system setting, or a fixed default?
3. Due-date calendar and format in Arabic: Gregorian with Arabic-Indic or Western digits?
4. Task list order: by creation date, by due date, or active first?
5. Should overdue tasks be visually highlighted?

Until answered, the spec (todo-app/spec) records these as explicit assumptions for CEO confirmation.

## Checklist

| Task | Owner | Depends on | Reviewer | Status |
|---|---|---|---|---|
| todo-app/setup | EMP-003 Sarah | — | — | done |
| todo-app/spec | EMP-002 Oliver | — | EMP-003 | done |
| todo-app/build | EMP-008 Emily | spec | EMP-006 | done |
| todo-app/tests | EMP-012 George | build | EMP-010 | done |
| todo-app/review | EMP-013 Eleanor | tests | reports to CEO | done — Go with conditions |
| todo-app/preview (protectedAction: public_release) | EMP-003 Sarah | review | CEO decides | done — CEO approved; published 2026-11-01 (run 41351368622) |

Approval gate: todo-app/preview is a public release — prepared by EMP-003 and sent to the CEO Approval Center; not performed without explicit CEO approval.

## Status

- Spec, build, tests and independent review: done. Preview: not published. It is waiting for CEO approval.
- Review verdict (`docs/review.md`): **Go with conditions**:
  1. The CEO confirms or amends assumptions A-1..A-5 (the spec is still a draft).
  2. The preview is labelled "not yet checked on a real iPhone/VoiceOver".
  3. A manual pass on a real iPhone happens before the team uses the app daily.
  4. Low findings F-1..F-7 are logged with owners: F-1..F-5 EMP-008, F-6..F-7 EMP-012. None of them blocks the preview.
- Test evidence: 95/95 tests passed locally. GitHub CI "todo-app CI" runs 41350170846, 41350189576 and 41350259061 succeeded.

## How the CEO publishes the preview

1. GitHub → agency-projects → Actions → **Publish previews** (https://github.com/mohamad-ilyas/agency-projects/actions/workflows/publish-previews.yml) → **Run workflow**.
2. Approve the `github-pages` deployment.
3. The preview appears at https://mohamad-ilyas.github.io/agency-projects/todo-app/.
4. Approve `todo-app/preview` in the dashboard's Approval Center.

Reports: projects/todo-app/reports/0001.json, 0002.json, 0003.json, 0004.json, 0005.json, 0006.json
