---
description: Give one task to one AI employee and report the result to the CEO's dashboard.
argument-hint: <employee name, role, or slug>: <what to do> [in <project key>]
---

The CEO's request: $ARGUMENTS

1. **Pick the employee.** Match the name, role, or slug against `.claude/agents/*.md` (e.g. "Henry", "UI/UX", "uiux-designer"). If none is named, choose the employee whose responsibilities fit and say who you chose. If the project key is given (`in cedar-app`), read `projects/<key>/PROJECT.md` for context.
2. **Rules.** The rules in `.claude/commands/new-project.md` apply: $0, protected actions go to the CEO, client code only in `agency-projects` (public — codenames, no confidential material), honesty about what was run, git branch `project/<key>` for project work (or `task/<short-name>` otherwise), never push to `main`.
3. **Record the start time** (`date -u +%Y-%m-%dT%H:%M:%SZ`) and **delegate** to that employee's subagent with the request, the relevant files, and the acceptance criteria you infer (state them).
4. If the work produced files, commit them. Record the end time.
5. **Report.** Write `company/outbox/task-<short-name>.report.json` per `docs/agent-report.md`:
   - with a project key: a `task.upsert` (key `<project>/<short-name>`, assignee = the employee) and a `work.record` for it;
   - without one: just the `work.record`.
   Do **not** add a `review` — the CEO reviews single tasks in the dashboard (Execution Center → the record → Approve / Request changes).
   Send it: `node scripts/aicos-report.mjs <file>`. On `NO_AGENT_KEY`, show the JSON in a ```json block for Execution Center → Import team report.
6. **Tell the CEO** in a few lines what the employee produced and that it is waiting for review in the dashboard.
