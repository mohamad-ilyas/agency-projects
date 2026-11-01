---
description: Resume an AI Company OS client project from where the team stopped.
argument-hint: <project key> [optional instructions from the CEO]
---

Resume project: $ARGUMENTS

1. Read `projects/<key>/PROJECT.md` (the first word above is the key) and `.claude/commands/new-project.md` — every rule there applies here too (privacy check, $0, protected actions, honesty, git branch `project/<key>`, reporting after every stage).
2. Check out branch `project/<key>`. If `PROJECT.md` is missing, stop and tell the CEO the key was not found; list the folders under `projects/`.
3. If the CEO added instructions or answered open questions, record them in `PROJECT.md` and, if they change scope, have Oliver (EMP-002) update the requirements and Sarah (EMP-003) the plan first — report those changes.
4. Continue from the first stage that is not done, exactly as `/new-project` describes. Use the next free report number for `company/outbox/<key>-<NNNN>.report.json`.
5. End with the same short final message: what changed, test results, artifacts, open questions, and what is waiting for the CEO's approval.
