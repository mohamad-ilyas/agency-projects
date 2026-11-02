---
description: Give one task to one AI employee and report the result to the CEO's dashboard.
argument-hint: <employee name, role, or slug>: <what to do> [in <project key>]
---

The CEO's request (via Charlotte, COO): $ARGUMENTS

1. **Pick the employee.** Match the name, role, or slug against `.claude/agents/*.md` (e.g. "Henry", "UI/UX", "uiux-designer"). If none is named, choose the employee whose responsibilities fit and say who you chose. If the project key is given (`in cedar-app`), read `projects/<key>/PROJECT.md` for context.
2. **Rules.** The rules in `.claude/commands/new-project.md` apply: $0, protected actions go to the CEO, client code only in `agency-projects` (public — codenames, no confidential material), honesty about what was run, git branch `project/<key>` for project work (or `task/<short-name>` otherwise), never push to `main`.
3. **Record the start time** (`date -u +%Y-%m-%dT%H:%M:%SZ`) and **delegate** to that employee's subagent with the request, the relevant files, and the acceptance criteria you infer (state them).
4. If the work produced files, commit them. Record the end time.
5. **Report.** Write the report per `docs/agent-report.md` to `projects/<key>/reports/task-<short-name>.json` (with a project key) or `reports/task-<short-name>.json` (without), commit, and push — GitHub delivers it to the dashboard within ~10 minutes:
   - with a project key: a `task.upsert` (key `<project>/<short-name>`, assignee = the employee) and a `work.record` for it;
   - without one: just the `work.record`.
   Add a `review` by the employee's manager (or, for design, Alexander EMP-015; for text, Edward EMP-014). Merges and releases of the result follow the Release process (Charlotte decides).
   Also try an immediate send: `node scripts/aicos-report.mjs <file> || true` (a failure is fine; never a duplicate).
6. **Charlotte (COO) tells the CEO** in a few lines what was produced and where to see it. Only she addresses the CEO.
