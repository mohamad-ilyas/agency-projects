# Agency projects (public)

Client work by the AI Company OS team. **This repository is PUBLIC** (CEO decision, for free unlimited builds):
everything committed here is visible to anyone. See the rules below before writing anything.
Dashboard: https://mohamad-ilyas.github.io/ai-company-os/ (source: mohamad-ilyas/ai-company-os).

- Start a client project: `/new-project <request>`. Small app or prototype: `/quick-app <request>`.
  Resume: `/continue-project <key>`. One task: `/task <employee>: <what>`.
- Releases: the COO (Charlotte) approves by committing `projects/<key>/release.json`; the **Release** workflow merges and
  deploys it to /agency-projects/<key>/ and reports the delivery. Learning: `/learn` updates `playbooks/`.
- Each client project lives in `projects/<key>/` on branch `project/<key>`; `PROJECT.md` there is its state file.
- The 15 employees are subagents in `.claude/agents/`. They are generated from the dashboard repository — edit them there
  and re-export (`npm run kit:export -- ../agency-projects` in ai-company-os), not here.
- Report every stage to the dashboard with `node scripts/aicos-report.mjs <file>` (see `docs/agent-report.md`).
  The agent key comes from `AICOS_AGENT_KEY` or the macOS Keychain item `aicos-agent-key`; never write it to a file.

## Non-negotiables
- Public repository: never commit secrets, signing keys, credentials, personal data, or confidential client material.
  Use client codenames unless the CEO said the name may be public. NDA/confidential work → ask the CEO for a private repo.
- $0: no paid services, APIs, trials, or accounts. Apple Developer ($99/yr) and Google Play ($25) need CEO approval.
- Merges, deployments and releases: the COO decides. Spending, contracts, client communication, deleting company
  data: the CEO decides, brought by the COO. Prepare these; never perform them without the decision.
- Never fabricate results. Never commit secrets, signing keys, or client credentials.
- Never push to `main` or force-push. Merges happen only through the Release workflow after the COO's approval.
- Only Charlotte Ashworth (COO) addresses the CEO.
