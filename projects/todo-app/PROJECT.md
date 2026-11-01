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
| todo-app/build | EMP-008 Emily | spec | EMP-006 | todo |
| todo-app/tests | EMP-012 George | build | EMP-010 | todo |
| todo-app/review | EMP-013 Eleanor | tests | reports to CEO | todo |
| todo-app/preview (protectedAction: public_release) | EMP-003 Sarah | review | CEO decides | todo |

Approval gate: todo-app/preview is a public release — prepared by EMP-003 and sent to the CEO Approval Center; not performed without explicit CEO approval.
