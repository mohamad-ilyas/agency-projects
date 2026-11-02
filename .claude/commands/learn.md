---
description: Learning session — employees research best practices and what's new in their role, update their living playbooks, and publish learning notes to the CEO's dashboard.
argument-hint: [employee slugs | all | rotation]  (default: rotation — the four employees whose playbooks are oldest)
---

Learning session for: $ARGUMENTS

The company's employees keep improving at their craft. You coordinate; each employee does their own learning through their subagent (`.claude/agents/<slug>.md`). Company rules apply ($0, honesty, no secrets, public repository).

## 1. Who learns today

- Specific slugs → those employees. `all` → everyone (heavy: use rarely).
- `rotation` or empty → read the `Last updated:` line of every `playbooks/<slug>.md`; pick the **four** employees whose playbooks are missing or oldest. Slugs and resources are in `docs/learning-resources.md`.

## 2. Each employee's session (delegate to their subagent)

Give them their focus areas and resources from `docs/learning-resources.md`, their current `playbooks/<slug>.md` (if any), and the review findings in `projects/*/docs/review.md` that concern their role. Ask them to:

1. **Research** what changed in the last three months and what current best practice is, for each focus area. Use web search; open the listed resources where the network allows. Prefer primary sources (official docs, release notes, standards).
2. **Cite everything**: every "what's new" item has a source link and a date. Never invent releases, statistics, or quotes; if something can't be confirmed, leave it out.
3. **Update `playbooks/<slug>.md`** (create it if missing), at most about two pages, in this structure:
   - `# Playbook — <Name>, <Title>` and `Last updated: YYYY-MM-DD`
   - **Standards we follow** — the role's best-practice checklist, short and actionable
   - **What's new** — dated, sourced items and what they change for our work (drop items older than a year)
   - **Lessons from our projects** — what our reviews found, and how to avoid it next time
   - **Watch list** — things to evaluate next session
4. Write a short **learning note** (what they learned, what they will do differently, sources).

## 3. Commit and report

- Work on branch `learning/<YYYY-MM-DD>`; commit only `playbooks/` and `reports/`; push. The Release workflow merges learning branches automatically (they may only touch those folders). Never push to `main`.
- Write `reports/learning-<YYYY-MM-DD>.json` (format: `docs/agent-report.md`, `reportId` = `learning-<YYYY-MM-DD>`), commit it with the playbooks, push, and also try `node scripts/aicos-report.mjs reports/learning-<YYYY-MM-DD>.json || true`. It contains, per employee:
  - `knowledge.upsert` — key `learning/<slug>/<YYYY-MM-DD>`, category `learning`, title `What's new — <Name> (<role>), <Month YYYY>`, tags `[<slug>]`, author = the employee, body = the learning note with sources;
  - `knowledge.upsert` — key `playbook/<slug>`, category `learning`, title `Playbook — <Name> (<role>)`, tags `[<slug>, "playbook"]`, author = the employee, body = the full updated playbook.
  - one `message.post` (kind `department`, the employee's department, author = the employee) summarising the most useful change in one or two sentences.

## 4. Finish

Tell whoever started the session, in a few lines, who learned what. Do not message the CEO directly — Charlotte (COO) includes learning highlights in her updates.
