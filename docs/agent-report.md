# Reporting team work to the dashboard (`aicos.report/v1`)

Every command ends a stage by writing a report file and sending it:

```bash
node scripts/aicos-report.mjs company/outbox/<name>.report.json
```

- Exit 0 `SENT` — it is in the CEO's inbox; the dashboard applies it on its next sync.
- Exit 3 `NO_AGENT_KEY` — not sent. Show the CEO the report JSON in a ```json block and tell them to paste it into **Execution Center → Import team report**.
- Exit 1 — invalid or rejected. Fix and resend; never claim it was delivered.

The dashboard applies each action through the company's normal rules, attributed to the employee named in it. The team **cannot** decide CEO approvals, delete anything, change settings, or complete a task that has a protected action — those go to the CEO's Approval Center.

Full schema: `docs/agent-report.schema.json`.

## Envelope

```json
{
  "schema": "aicos.report/v1",
  "reportId": "cedar-app-0001",          // unique per report (project key + counter is fine)
  "sentAt": "2026-11-03T09:40:00Z",      // real time from `date -u +%Y-%m-%dT%H:%M:%SZ`
  "source": "claude_code_web",           // claude_code (Mac) | claude_code_web | claude_chat
  "summary": "Requirements done and approved by Sarah",
  "actions": [ … ]
}
```

## Keys

Projects and tasks are referenced by **keys you choose and never change**: lowercase, digits, `-`, `_`, `/`.
Project `cedar-app`; tasks `cedar-app/requirements`, `cedar-app/build-cart`. Re-sending `project.upsert` / `task.upsert`
with the same key updates the record instead of duplicating it. Record every key in `projects/<key>/PROJECT.md`.

## Actions

```jsonc
// Create or update a project (managerId defaults to EMP-003 Sarah Mitchell)
{ "type": "project.upsert", "key": "cedar-app", "name": "Cedar ordering app", "client": "Cedar & Co.",
  "description": "…", "businessRequirements": "…", "technicalRequirements": "…", "scope": "…",
  "priority": "high", "startDate": "2026-11-03", "targetDate": "2026-12-15", "managerId": "EMP-003",
  "memberIds": ["EMP-002","EMP-007"], "repoUrl": "https://github.com/…", "status": "development" }

// Create or update a task. Tasks wait in the backlog until every dependsOn task is completed.
{ "type": "task.upsert", "key": "cedar-app/build", "projectKey": "cedar-app", "title": "Build the app",
  "description": "…", "assigneeId": "EMP-007", "priority": "high", "dueDate": "2026-11-20",
  "dependsOn": ["cedar-app/architecture"], "acceptanceCriteria": ["…"], "expectedOutput": "…",
  "stage": "development", "protectedAction": "public_release" }

// Record real work by one employee, optionally reviewed by a DIFFERENT employee.
// Completed work goes to review; an approved review completes the task (or sends a protected task to the CEO).
{ "type": "work.record", "employeeId": "EMP-007", "taskKey": "cedar-app/build", "title": "Build the app",
  "instructions": "what was asked", "status": "completed", "startedAt": "…", "endedAt": "…",
  "summary": "2–4 sentences", "output": "full Markdown deliverable or a precise summary with file paths",
  "logs": [{ "at": "…", "message": "ran npm test: 14 passed" }], "errors": [], "openQuestions": [],
  "deliverables": [{ "title": "App source", "type": "source_code", "location": "https://github.com/…/tree/…/projects/cedar-app/app" }],
  "handoff": { "to": "EMP-012", "note": "Ready for automation" },
  "review": { "reviewerId": "EMP-006", "decision": "approved", "notes": "Architecture followed" } }

// Move a task (forward steps are walked automatically). Not allowed: awaiting_ceo_approval.
{ "type": "task.status", "taskKey": "cedar-app/build", "status": "blocked", "note": "Waiting for menu data", "by": "EMP-007" }

// Ask the CEO to approve a protected action (store publishing, sending to the client, spending…)
{ "type": "approval.request", "action": "public_release", "title": "Publish Cedar app to Google Play",
  "requestedBy": "EMP-003", "reason": "…", "impact": "…", "risk": "high", "projectKey": "cedar-app",
  "taskKey": "cedar-app/release", "supportingFiles": [{ "label": "Release notes", "url": "https://github.com/…" }] }

// Discussion / decisions / meeting notes, written by the employee
{ "type": "message.post", "kind": "project", "projectKey": "cedar-app", "authorId": "EMP-003", "body": "…" }

// A deliverable that is not tied to a work.record
{ "type": "deliverable.record", "title": "Android test build", "deliverableType": "source_code",
  "location": "https://github.com/…/actions/runs/123", "projectKey": "cedar-app", "ownerId": "EMP-012" }

// Result of an assignment the CEO created in the dashboard (EXE-…), see /run-assignment
{ "type": "execution.result", "result": { "schema": "aicos.result/v1", "executionId": "EXE-0002", … } }
```

## Honesty rules

- Only report what actually happened. Commands run → real output. Not run → say so.
- `startedAt` / `endedAt` are real times, or omit them.
- Deliverable locations must exist (a pushed file, a run URL), not intentions.
- A reviewer is never the author.
