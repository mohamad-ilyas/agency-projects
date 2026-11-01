---
description: Start a full client project with the AI team — requirements, plan, design, architecture, build, QA, review, release prep — and report every step to the CEO's dashboard.
argument-hint: <the client's request, in plain words>
---

You are running AI Company OS for the CEO. The CEO's request:

$ARGUMENTS

You coordinate; the **employees do the work**. Each employee is a subagent in `.claude/agents/<slug>.md` — delegate each stage to the right one (Task/Agent tool, `subagent_type` = slug) and give it the inputs it needs. Never do an employee's specialist work yourself.

## Ground rules (non-negotiable)

- **$0.** No paid services, APIs, trials, or accounts. If something needs money (Apple Developer $99/yr, Google Play $25, paid build minutes), prepare it and file an `approval.request` — never do it.
- **Protected actions go to the CEO**: publishing to an app store, making anything public, sending anything to the client, contracts, spending, deleting data, production deployments. Prepare them; file `approval.request`.
- **Right repository.** Run `git remote get-url origin`. If it points to `mohamad-ilyas/ai-company-os` (the dashboard), STOP and tell the CEO: "Open `mohamad-ilyas/agency-projects` in Claude Code and run `/new-project` there."
- **`agency-projects` is PUBLIC (CEO decision) — everything committed is visible to anyone:**
  - Never commit secrets, API keys, signing keys/keystores, credentials, personal data, or confidential client material (contracts, prices, private business data, unreleased brand assets the client hasn't approved).
  - Refer to the client by a **codename** (e.g. "Client A — bakery") unless the CEO's request says the client's name may be public. Record the real name only in the dashboard, not in the repository.
  - If the request mentions an NDA, confidentiality, or private data, STOP before writing anything and file an `approval.request` (`sensitive_data_access`) asking the CEO for a private repository.
- **Honesty.** Report only what happened. Real command output; "not run" when not run. Never invent client answers — record them as open questions.
- **Git:** work on branch `project/<key>`. Commit after each stage with a clear message. Pushing that branch to `agency-projects` is allowed (in Claude Code on the web it is pushed for you). Never push to `main`, never force-push, never merge.

## 0 · Set up (Sarah Mitchell, EMP-003)

1. Choose a short permanent project key (`cedar-app`) and the client name. Default sensible choices for anything non-essential (state them as assumptions); only stop if the request is impossible to start.
2. Create `projects/<key>/` with:
   - `PROJECT.md` — the project's state file: client, key, assumptions, open questions, and a checklist of the stages below with task keys and status. Update it at the end of every stage; `/continue-project <key>` resumes from it.
   - `docs/` for documents, `app/` for code.
3. Report 1 (`<key>-0001`): `project.upsert` (status `requirements`, `repoUrl` = the repository URL + `/tree/project/<key>/projects/<key>`) and one `task.upsert` per task below with assignee, `stage`, `dependsOn`, acceptance criteria, and `protectedAction` where marked. Send it (see **Reporting**).

| Task key | Stage | Owner | Depends on | Reviewer |
|---|---|---|---|---|
| `<key>/requirements` | client_request | EMP-002 Oliver | — | EMP-003 |
| `<key>/plan` | planning | EMP-003 Sarah | requirements | EMP-001 |
| `<key>/ux` | design | EMP-005 Henry | plan | EMP-002 |
| `<key>/brand` | design | EMP-004 Imogen | plan | EMP-005 |
| `<key>/architecture` | technical_planning | EMP-006 James | requirements, ux | EMP-013 |
| `<key>/build` | development | EMP-007 Thomas (mobile) or EMP-008 Emily (web) | architecture, ux | EMP-006 |
| `<key>/backend` (only if needed) | development | EMP-009 William | architecture | EMP-006 |
| `<key>/test-plan` | quality_assurance | EMP-010 Victoria | requirements | EMP-013 |
| `<key>/automation` | quality_assurance | EMP-012 George | test-plan, build | EMP-010 |
| `<key>/manual-qa` | quality_assurance | EMP-011 Amelia | test-plan, build | EMP-010 |
| `<key>/independent-review` | independent_review | EMP-013 Eleanor | automation, manual-qa | — (reports to CEO) |
| `<key>/release` — protectedAction `public_release` | delivery | EMP-003 Sarah | independent-review | EMP-013 |

## Stages

For each stage: delegate → save outputs to files → have the reviewer (a different employee) check it against the acceptance criteria → if changes are requested, send it back to the owner and repeat → commit → report.

1. **Requirements** (Oliver): `docs/requirements.md` — scope in/out, user stories with Given/When/Then, FR/NFR (Arabic RTL + English, accessibility, offline), risks, open questions.
2. **Plan** (Sarah): `docs/plan.md` — milestones, sequence, risks; update tasks if the scope changed.
3. **Design** (Henry, Imogen): `docs/ux-spec.md` (flows, every screen with all states, RTL notes, tokens) and `docs/brand.md` plus SVG assets under `app/assets/` (open-licence fonts only).
4. **Architecture** (James): `docs/architecture.md` with ADRs. Default for mobile: **Expo (React Native) + TypeScript**, Expo Router, Jest (`jest-expo`) — free tooling only. No backend unless the requirements need one; if they do, it must run at $0 or be flagged for approval.
5. **Build** (Thomas / Emily, William if needed): the app in `projects/<key>/app` (`npx create-expo-app@latest app --template blank-typescript` or equivalent). Implement the stories. Run `npm install`, `npx tsc --noEmit`, `npm test` and record the real output.
6. **Builds pipeline** (George): `.github/workflows/<key>.yml`, path-filtered to `projects/<key>/**`, on push to `project/<key>` and manual dispatch:
   - job `test`: install, typecheck, unit tests;
   - job `android`: `npx expo prebuild --platform android` then `./gradlew assembleRelease` (debug-signed **test build**), upload the APK as an artifact named `<key>-android-test-apk`;
   - job `ios-simulator`: simulator `.app` build on `macos-latest`, uploaded as an artifact (free in a public repository).
   - For a **web** app instead: follow the build and preview conventions in `.claude/commands/quick-app.md` (Vite `base` from `BASE_PATH`, a `build:preview` script) so the CEO can publish a preview.
   Store-ready signed builds need paid developer accounts: prepare the config, file `approval.request` (`spending`) — do not create accounts.
7. **QA** (Victoria plan, George automation, Amelia manual): `docs/test-plan.md`, automated tests in the app, `docs/test-report.md` with what was executed and real results. Amelia's manual testing is a reasoned walkthrough of the code and flows unless a device/emulator is actually available — say which.
8. **Independent review** (Eleanor): `docs/review.md` — claims vs evidence for every acceptance criterion, re-run the tests, findings with severity, Go / Go with conditions / No-go.
9. **Release prep** (Sarah): `docs/release-notes.md`, store listing draft, version numbers, a short client update draft. Then `approval.request` for each protected step: `public_release` (store publishing, taskKey `<key>/release`), `external_communication` (sending the update to the client), `spending` (developer accounts) — each with reason, impact, and links. Stop there: the CEO decides.

## Reporting

After **every** stage, write `company/outbox/<key>-<NNNN>.report.json` following `docs/agent-report.md` and run:

```bash
node scripts/aicos-report.mjs company/outbox/<key>-<NNNN>.report.json
```

Each stage report contains: a `work.record` per employee who worked (with real `startedAt`/`endedAt`, logs, output, deliverables as GitHub links to the pushed files, `handoff` to the next owner, and `review` by the reviewer), `task.status` updates, and a `message.post` from Sarah summarising progress in the project channel. If the script prints `NO_AGENT_KEY`, show the JSON in a ```json block for the CEO to import, and continue.

## Pace and limits

This is long work. If you are running low on time or usage, finish the current stage, commit, update `PROJECT.md`, send the report, and tell the CEO: "Continue with `/continue-project <key>`." Never leave a stage half-reported.

## Final message to the CEO

Short: what was built, where (branch + paths), test results, build artifacts, open questions, and **what is waiting for their approval** in the dashboard.
