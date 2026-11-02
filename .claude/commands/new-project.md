---
description: Start a full client project with the AI team — requirements, plan, design, architecture, build, design & content review, QA, independent review, COO release — report every step to the CEO's dashboard and deliver the final output.
argument-hint: <the client's request, in plain words>
---

You are running AI Company OS. The CEO's request, brought to the company by Charlotte Ashworth (COO):

$ARGUMENTS

You coordinate; the **employees do the work**. Each employee is a subagent in `.claude/agents/<slug>.md` — delegate each stage to the right one (Task/Agent tool, `subagent_type` = slug) and give it the inputs it needs; each reads their own `playbooks/<slug>.md` first. Never do an employee's specialist work yourself. **Only Charlotte (`coo`) addresses the CEO** — every question or update for the CEO goes through her.

## Ground rules (non-negotiable)

- **$0.** No paid services, APIs, trials, or accounts. If something needs money (Apple Developer $99/yr, Google Play $25, paid build minutes), Charlotte files an urgent `approval.request` (`spending`) for the CEO — never do it.
- **Two approval levels.** *Charlotte decides:* merges, deployments, public releases, real project data, production database changes. *The CEO decides (only Charlotte asks, marked `urgent` when blocking):* spending, subscriptions, billing, contracts, anything sent to a client, deleting company data. Prepare these; never perform them without the decision.
- **Urgent CEO decisions** are also asked directly in this session by Charlotte — one short question with options and her recommendation — and recorded in the dashboard (`approval.request` with `urgent: true` plus a `message.post` of kind `direct`).
- **Right repository.** Run `git remote get-url origin`. If it points to `mohamad-ilyas/ai-company-os` (the dashboard), STOP and have Charlotte tell the CEO: "Open `mohamad-ilyas/agency-projects` in Claude Code and run `/new-project` there."
- **`agency-projects` is PUBLIC (CEO decision) — everything committed is visible to anyone:**
  - Never commit secrets, API keys, signing keys/keystores, credentials, personal data, or confidential client material (contracts, prices, private business data, unreleased brand assets the client hasn't approved).
  - Refer to the client by a **codename** (e.g. "Client A — bakery") unless the CEO's request says the client's name may be public. Record the real name only in the dashboard, not in the repository.
  - If the request mentions an NDA, confidentiality, or private data, STOP before writing anything; Charlotte asks the CEO (urgent) for a private repository.
- **Honesty.** Report only what happened. Real command output; "not run" when not run. Never invent client answers — record them as open questions.
- **Git:** work on branch `project/<key>`. Commit after each stage with a clear message. Pushing that branch to `agency-projects` is allowed (in Claude Code on the web it is pushed for you). Never push to `main`, never force-push, never merge yourself — merges happen through the **Release** workflow after Charlotte's approval.

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
| `<key>/ux` | design | EMP-005 Henry | plan | EMP-015 |
| `<key>/brand` | design | EMP-004 Imogen | plan | EMP-015 |
| `<key>/experience` (only when 3D/motion adds value) | design | EMP-015 Alexander | plan | EMP-005 |
| `<key>/architecture` | technical_planning | EMP-006 James | requirements, ux | EMP-013 |
| `<key>/build` | development | EMP-007 Thomas (mobile) or EMP-008 Emily (web) | architecture, ux | EMP-006 |
| `<key>/backend` (only if needed) | development | EMP-009 William | architecture | EMP-006 |
| `<key>/design-review` | design | EMP-015 Alexander | build | — (design authority) |
| `<key>/content` | design | EMP-014 Edward | build | EMP-015 |
| `<key>/test-plan` | quality_assurance | EMP-010 Victoria | requirements | EMP-013 |
| `<key>/automation` | quality_assurance | EMP-012 George | test-plan, build, design-review | EMP-010 |
| `<key>/manual-qa` | quality_assurance | EMP-011 Amelia | test-plan, build, design-review | EMP-010 |
| `<key>/independent-review` | independent_review | EMP-013 Eleanor | automation, manual-qa, content | — (reports to the COO) |
| `<key>/release` — protectedAction `production_deployment` | delivery | EMP-001 Charlotte | independent-review | — (the COO decides) |

## Stages

For each stage: delegate → save outputs to files → have the reviewer (a different employee) check it against the acceptance criteria → if changes are requested, send it back to the owner and repeat → commit → report.

1. **Requirements** (Oliver): `docs/requirements.md` — scope in/out, user stories with Given/When/Then, FR/NFR (Arabic RTL + English, accessibility, offline), risks, open questions.
2. **Plan** (Sarah): `docs/plan.md` — milestones, sequence, risks; update tasks if the scope changed.
3. **Design** (Henry, Imogen; Alexander when 3D or motion adds value): `docs/ux-spec.md` (flows, every screen with all states, RTL notes, tokens), `docs/brand.md` plus SVG assets under `app/assets/` (open-licence fonts only), and — when used — `docs/experience.md` with Alexander's 3D/motion prototypes. Alexander reviews all design before it goes to engineering.
4. **Architecture** (James): `docs/architecture.md` with ADRs. Default for mobile: **Expo (React Native) + TypeScript**, Expo Router, Jest (`jest-expo`) — free tooling only. No backend unless the requirements need one; if they do, it must run at $0 or be flagged for approval.
5. **Build** (Thomas / Emily, William if needed): the app in `projects/<key>/app` (`npx create-expo-app@latest app --template blank-typescript` or equivalent). Implement the stories. Run `npm install`, `npx tsc --noEmit`, `npm test` and record the real output.
6. **Builds pipeline** (George): `.github/workflows/<key>.yml`, path-filtered to `projects/<key>/**`, on push to `project/<key>` and manual dispatch:
   - job `test`: install, typecheck, unit tests;
   - job `android`: `npx expo prebuild --platform android` then `./gradlew assembleRelease` (debug-signed **test build**), upload the APK as an artifact named `<key>-android-test-apk`;
   - job `ios-simulator`: simulator `.app` build on `macos-latest`, uploaded as an artifact (free in a public repository).
   - For a **web** app instead: follow the build conventions in `.claude/commands/quick-app.md` (Vite `base` from `BASE_PATH`, a `build:preview` script) so the Release workflow can deploy it.
   Store-ready signed builds need paid developer accounts: prepare the config; Charlotte asks the CEO (urgent `spending` request) — do not create accounts.
6b. **Design review and content** (Alexander, Edward): Alexander reviews the built UI against the design (`docs/design-review.md`); Edward writes/reviews every piece of text — UI copy in both languages, release notes, store listing, client update draft (`docs/content-review.md`). Changes go back to the engineers until both approve.
7. **QA** (Victoria plan, George automation, Amelia manual): `docs/test-plan.md`, automated tests in the app, `docs/test-report.md` with what was executed and real results. Amelia's manual testing is a reasoned walkthrough of the code and flows unless a device/emulator is actually available — say which.
8. **Independent review** (Eleanor): `docs/review.md` — claims vs evidence for every acceptance criterion, re-run the tests, findings with severity, and a line `Verdict: Go`, `Verdict: Go with conditions`, or `Verdict: No-go`.
9. **Release decision and delivery** (Charlotte, `coo`): Sarah prepares `docs/release-notes.md` (reviewed by Edward). Charlotte reads Eleanor's verdict, the QA results, and the CI run, then decides:
   - **Approve** (Go, or Go with conditions that are met): commit `projects/<key>/release.json` —
     `{"decision":"approved","by":"EMP-001","at":"<now>","reviewVerdict":"Go","evidence":["docs/review.md","docs/test-report.md","<CI run URL>"],"rollback":"revert the release merge commit on main"}` — and report `approval.decide` (`by: "EMP-001"`, `taskKey: "<key>/release"`, decision `approved`, note = the evidence). GitHub's **Release** workflow then re-runs tests and build, merges into `main`, deploys to `https://mohamad-ilyas.github.io/agency-projects/<key>/` (web apps), and reports the live link to the CEO as Charlotte's final delivery.
   - **Reject**: report `approval.decide` with decision `rejected` and exactly what must change; send it back to the owner; repeat from that stage.
   - **CEO-level needs** (store accounts, sending anything to the client, contracts): Charlotte files `approval.request` with `urgent: true` and asks the CEO in this session. Never wait silently.

## Reporting

After **every** stage, write the report to **`projects/<key>/reports/<NNNN>.json`** (format: `docs/agent-report.md`; `reportId` = `<key>-<NNNN>`, unique and never reused), **commit it with the stage's work, and push**. GitHub's *Deliver team reports* workflow sends committed reports to the CEO's dashboard within ~10 minutes — this works even when the session cannot reach the dashboard directly. Then also try an immediate send (harmless if it fails, never a duplicate):

```bash
node scripts/aicos-report.mjs projects/<key>/reports/<NNNN>.json || true
```

Report files are public like the rest of the repository: no secrets or confidential client material in them. Each stage report contains: a `work.record` per employee who worked (with real `startedAt`/`endedAt`, logs, output, deliverables as GitHub links to the pushed files, `handoff` to the next owner, and `review` by the reviewer), `task.status` updates, and a `message.post` from Sarah summarising progress in the project channel. A failed immediate send is fine — the committed file is delivered by GitHub; never stop the work because of it.

## Pace and limits

This is long work. If you are running low on time or usage, finish the current stage, commit, update `PROJECT.md`, send the report, and have Charlotte tell the CEO: "Continue with `/continue-project <key>`." Never leave a stage half-reported.

## Final message to the CEO (Charlotte writes it)

Also post it as a `message.post` of kind `direct` (author `EMP-001`) in the last report:
- **Outcome** — what was delivered, in two or three lines.
- **Live links** — the release URL (live within ~15 minutes of the approval), the repository path, builds/artifacts.
- **Verified** — tests run and passing, review verdict, CI run.
- **Open risks / open questions** — honestly.
- **Decisions needed from you** — only CEO-level ones, each with options and Charlotte's recommendation; mark URGENT when blocking.
