# xo-online: Independent review (EMP-013 Eleanor Whitfield, 2026-11-01)

**Verdict:** Go with conditions

Current status, from the re-review on 2026-11-02 of branch `project/xo-online` at `7491dcc`, for a new production release to GitHub Pages (https://mohamad-ilyas.github.io/agency-projects/xo-online/). The COO (EMP-001) makes the release decision. The original 2026-11-01 assessment follows that section and is kept unchanged except for its heading line.

## Re-review 2026-11-02

Independence: I did not contribute to the fixes, the tech-lead review, the content edits, the test report or the `release.yml` change.

**Scope.** I read `git diff 47ad342 HEAD`, covering 22 files: `lib/{room,client,bidi,i18n}.ts`, `components/{GameScreen,Lobby,Announcer,Isolated,NameForm}.tsx`, `App.tsx`, `index.css`, both new `review-fixes` test files, the changed us2, us7, us8, us12 and journey tests, `docs/test-report.md`, `release.json` and `.github/workflows/release.yml`. I did not change any app code, I did not commit, and I deleted `dist/` after the build.

### Commands I ran (real output, 2026-11-02 19:24–19:25 UTC, sandbox Linux, Node v22.23.4, npm 10.9.9, in `projects/xo-online/app`)

```
$ npm ci
found 0 vulnerabilities

$ npm test
 Test Files  18 passed (18)
      Tests  107 passed (107)
   Start at  19:24:50
   Duration  15.37s (tests 55%, environment 34%, setup 6%, import 3%, transform 1%, worker 1%)
(exit 0)

$ npx tsc -b
(no output, exit 0)

$ BASE_PATH=/agency-projects/xo-online/ npm run build:preview
✓ 41 modules transformed.
dist/index.html                     1.76 kB │ gzip:  0.84 kB
dist/assets/index-NnQHA5Cb.css     18.26 kB │ gzip:  4.98 kB
dist/assets/index-D1y5XJiv.js     264.28 kB │ gzip: 83.08 kB
dist/assets/mqtt.esm-BZmp_r8e.js  329.99 kB │ gzip: 98.79 kB
✓ built in 591ms
(exit 0)
$ rm -rf dist

$ npx oxlint              -> no output, exit 0
$ npm audit --omit=dev    -> found 0 vulnerabilities
```

- `dist/index.html` references only `/agency-projects/xo-online/assets/...` and `/agency-projects/xo-online/favicon.svg`.
- The only `wss://` URL in the bundle is `wss://broker.hivemq.com:8884/mqtt`.
- The build hashes match the ones in George's test report.
- The diff adds no secrets, keys or personal data.

**GitHub evidence (checked with `gh run list` / `gh run view`, 2026-11-02).**
- The "xo-online CI" runs succeeded on 47ba2e5, 75c25d3, dda7125 and 7491dcc (run 41509559196).
- The previous Release run, 41502430554, merged and deployed successfully. Its deploy job then failed in "Report the final delivery to the CEO's dashboard" with `line 9: syntax error near unexpected token '('`. This is the bug that the `release.yml` change fixes.
- That same run pushed a merge that added `.github/workflows/xo-online.yml` to `main`. The bot's push of workflow-file changes therefore works in practice.

### `release.yml` change (`git diff 47ad342 HEAD -- .github/workflows/release.yml`)

| Check | Evidence | Result |
|---|---|---|
| YAML is valid; the heredoc sits inside the `run: \|` block scalar | `yaml.safe_load` parses the file. The step's `run` text, extracted from the parsed YAML, has `JS` alone on line 12 at column 0 once the 10-space block indent is removed | Pass |
| Heredoc is quoted, so the shell expands nothing | `<<'JS'`: `${key}`, `${sha...}`, backticks and the apostrophe in "COO's" reach Node literally. The script contains no `${{`, so Actions does not interpolate it | Pass |
| argv slice | `node file.mjs key url sha` gives `process.argv.slice(2)` = `[key, url, sha]`. The old `node -e` form correctly used `slice(1)` | Pass |
| ESM import | `.mjs` file with `import { writeFileSync } from "node:fs"`. CI runs Node 24 | Pass |
| Behaviour | I extracted the step and ran it with `bash --noprofile --norc -eo pipefail`, `RELEASED=xo-online`, a fake SHA and the reporter replaced by `echo`, so nothing was sent. Exit 0. `delivery.json` had `reportId` `release-xo-online-7491dcc`, location `https://mohamad-ilyas.github.io/agency-projects/xo-online/`, and the description text including the apostrophe | Pass |
| Old step on `main` | The same harness on `origin/main`'s step gives `line 9: syntax error near unexpected token '('`, exit 2. This reproduces the failure in run 41502430554 | Confirms the bug |

### Status of the original findings

| ID | Sev. | Status | Evidence (code + tests) |
|---|---|---|---|
| F-01 | Medium | **Open** (post-deploy, as the COO accepted on 2026-11-02) | There is still no run against the live broker. The COO's approval in 2d6c8fc deferred this check to after deploy (EMP-011). |
| F-02 | Medium | **Resolved** (residual accepted, see below) | `parseRoom` rejects these cases. It rejects `version` that is not a safe integer or is outside 1…1e9. It rejects timestamps or `lastSeen` that are negative or more than 10 min ahead of the receiver's clock. It rejects counters above 1e6, `scoredRound > round`, and boards where the X and O counts differ by more than 1. `plausibleVersion` rejects jumps of more than 1000 versions, and a seated player re-publishes its own state when that happens. `openGames` skips future-dated rooms and caps the list at 50. `XoClient` holds at most 300 rooms. 8 `F-02 …` tests pass. **Residual:** a deliberate attacker can still overwrite a game by sending `version + ≤1000`. This is anti-cheat, which the spec puts out of scope, and A1 is accepted. |
| F-03 | Medium | **Resolved** | `watchLobby` no longer clears rooms. Only `leaveRoom` → `clearRoom` does, by a seated player. Test `F-03 a viewer whose clock is 25 h ahead…` passes and asserts that no clearing payload is published. |
| F-04 | Medium | **Accepted** | The CEO instructed that A1–A6 proceed as documented defaults (`release.json` at 2d6c8fc, condition 1). |
| F-05 | Low | **Resolved** | `touchWaitingRoom` keeps the same version and a newer `updatedAt`, and only for the lone host. A join bumps the version, so it always wins. `keepWaitingRoomFresh` runs every 2 min while the host is online. 2 lib tests and 1 UI test pass. The AC-7.2 behaviour changed, and the us7 test now unmounts the host (see N-04). |
| F-06 | Low | **Resolved** (minor residual N-03) | `normalizeName` strips C0/C1 controls, ALM, LRM/RLM, LRE–RLO, LRI–PDI and BOM, both on input and in `parseRoom`. Names in sentences are wrapped in FSI…PDI and rendered as `<bdi>` through `Isolated`: turn heading, result, rematch, waiting-for, live region and lobby title. 5 `F-06 …` tests pass. |
| F-07 | Low | **Open** | George reports a Chromium reduced-motion check (longest animation 0.2 s). The script and its output are not in the repo, so I could not verify it. No check on a real device or real OS setting has been recorded. |
| F-08 | Low | **Partially resolved; open for PROJECT.md** | The test report now states 42 ACs, 36 covered and 6 partial (matching this review) and lists the CI run IDs. I confirmed those run IDs with `gh`. The `PROJECT.md` "Status" section is still stale: it says "Preview: not published…", although `xo-online` was released in 47ad342. |
| F-09 | Low | **Resolved** | A privacy note (EN/AR) appears on the name screen and in the footer. `goOffline` (pagehide) clears this client's retained room heartbeats. Tests `F-09 …` (2) pass. **Residual (accepted):** one retained Will message per client (`presence/_/<clientId>`) still stays on the broker. It is overwritten in place, so it does not grow per game. |
| F-10 | Low | **Open** | This belongs in the F-01 two-device check. No code change was expected. |

**Counts:** 5 resolved (F-02, F-03, F-05, F-06, F-09), 1 accepted (F-04), 4 open (F-01, F-07, F-08 partial, F-10). No open finding is High or Critical.

### New findings

| ID | Severity | Finding and evidence | Expected change | Owner |
|---|---|---|---|---|
| N-01 | Low | **Silent stall when a peer's clock is more than 10 min behind.** `parseRoom` rejects any state whose `createdAt`/`updatedAt`/`lastSeen` is more than `MAX_FUTURE_SKEW_MS` (10 min) ahead of the *receiver's* clock. A receiver whose clock is more than 10 min behind ignores every update from its opponent: a joiner sees "Game not found", and a seated player sees moves stop arriving. No message tells the player why. This is my analysis of the code; I did not run it on two devices. Devices synced by NTP are unaffected. | Accept for this release (James chose 10 min on purpose). Optionally, later: show a "check your device clock" hint when a valid-shape state is rejected only for skew. Add a skewed-clock case to the F-01 manual check. | EMP-008 (later), EMP-011 |
| N-02 | Low | **The delivery report will fail once more for this release.** Scheduled runs use the workflow on `main` at trigger time. `main` (47ad342) still has the broken step, so the run that merges this release will deploy Pages and then fail at "Report the final delivery…", as run 41502430554 did. The fix takes effect from the next Release run after this merge. There is no user impact. | The COO expects a red deploy job on this release run and records the delivery on the dashboard by hand (`node scripts/aicos-report.mjs`). Check that the following Release run's report step succeeds. | EMP-001 |
| N-03 | Low | **Two strings still interpolate names without isolation.** These are the lobby join button `aria-label={t.joinAria(host.name)}` (`Lobby.tsx:107`) and the `ShareBox` `hostName` share text. Bidi controls are already stripped, so only cosmetic ordering of mixed-script names is affected. | Wrap with `isolate()` in a later change. | EMP-008 |
| N-04 | Low | **AC-7.2 meaning changed without a recorded product decision.** "Idle" now means "host gone", where it used to mean "no room update for 10 min". The us7 AC-7.2 test was adapted: it now unmounts the host before advancing the clock. I consider the new behaviour better and the adapted test sound. My original F-05 asked for a product decision, and none is recorded. | EMP-002 or the COO notes the AC-7.2 interpretation in `docs/spec.md` or `PROJECT.md`. | EMP-002 / EMP-001 |

### Unverified items (re-review)

- Live public-broker play, latency, Last Will, reconnect, cleared retained topics, and real two-device clock skew (F-01, F-10, N-01).
- George's Chromium local-mode and 360 px check: claim only, with no script or artifact in the repo.
- The release-run report step on GitHub itself: I validated it locally only, and N-02 means the first real execution will be the release after this one.

### Release recommendation (production release of `7491dcc`)

**Go with conditions.** The decision belongs to the COO.

1. **N-02:** expect this release run's deploy job to fail at the delivery-report step after Pages has deployed. Confirm that the site is live, then report the delivery by hand.
2. **F-01 / F-10 / N-01:** EMP-011 runs the live two-device check right after deploy, as already agreed in the 2d6c8fc conditions, and adds a near-simultaneous join and a device clock set more than 10 min behind. Record dates, devices and results. Until then, live play is "unverified", not "passed".
3. Non-blocking follow-ups: F-08 (`PROJECT.md` status), N-03, N-04, and F-07 (real-device reduced-motion check).

Rollback: revert the release merge commit on `main`, as stated in `release.json`.

---


**Original assessment (2026-11-01): Go with conditions, for publishing a PREVIEW only (not production).** The CEO makes the decision.
I found no High-severity defect. The game logic and UI behave as specified when run against the in-memory broker. My re-run gave 88/88 tests passing and a clean preview build. I found no secrets or personal data, and the $0 rule holds.
The main risks are on the live public broker. Nothing here has been run against it, and it is open to anyone. Those risks are acceptable for a CEO-only preview. They must be resolved or accepted before any production release.

Independence: I did not contribute to the spec, the build or the tests of xo-online.

## Scope reviewed

- `docs/spec.md` (12 stories, **42** ACs), `docs/test-report.md`, `PROJECT.md`, `reports/0001–0004.json`.
- `app/` source: `src/lib/{room,client,transport,name,ids,router,prefs}.ts`, `src/main.tsx`, `src/components/{GameScreen,Board,NameForm,ShareBox,Announcer,StatusPill,Lobby}.tsx`, `src/context.ts`, the reduced-motion block in `src/index.css`, `vite.config.ts`, `package.json`, `.gitignore`, and the built `dist/index.html`.
- Tests: I listed every `it(...)` name and read the AC-6.2 and AC-10.3 tests in full.
- `.github/workflows/xo-online.yml`.
- I did not modify any app code and did not commit. `dist/` was deleted after the build.

## Commands I ran (real output, 2026-11-01 22:15 UTC, sandbox Linux, Node v22.23.4, npm 10.9.9)

All commands ran in `projects/xo-online/app`.

```
$ npm ci
added 153 packages, and audited 154 packages in 3s
found 0 vulnerabilities

$ npm test
 RUN  v5.0.5 /home/user/agency-projects/projects/xo-online/app
 Test Files  16 passed (16)
      Tests  88 passed (88)
   Start at  22:15:48
   Duration  11.98s (tests 55%, environment 33%, setup 6%, transform 4%, import 2%)
(exit 0)

$ BASE_PATH=/agency-projects/xo-online/ npm run build:preview
> tsc -b && vite build
vite v8.3.5 building client environment for production...
✓ 39 modules transformed.
dist/index.html                     1.76 kB │ gzip:  0.84 kB
dist/assets/index-CAaW12EO.css     18.16 kB │ gzip:  4.95 kB
dist/assets/index-FarD9eT3.js     261.65 kB │ gzip: 82.21 kB
dist/assets/mqtt.esm-BZmp_r8e.js  329.99 kB │ gzip: 98.79 kB
✓ built in 455ms
(exit 0)
$ rm -rf dist

$ npx oxlint        -> no output, exit 0
$ npm audit --omit=dev -> found 0 vulnerabilities
```

`dist/index.html` references `/agency-projects/xo-online/assets/...` and `/agency-projects/xo-online/favicon.svg`, so the base path is correct. The bundle contains only the public broker URL `wss://broker.hivemq.com:8884/mqtt`. It contains no keys, tokens or e-mail addresses.

## Claims vs evidence (team claims)

| Claim (source) | Evidence I checked | Verdict |
|---|---|---|
| 88 tests pass, 16 files (0004, test report) | My re-run: 16 files, 88 tests passed | Verified |
| build:preview passes (0003, 0004) | My re-run with BASE_PATH: exit 0, correct base path | Verified |
| `npm ci` 0 vulnerabilities (0003) | My re-run: 0 vulnerabilities; `npm audit --omit=dev`: 0 | Verified |
| oxlint clean (0003, test report) | `npx oxlint` exit 0 | Verified |
| "48 ACs: 43 covered, 5 partial" (test report) | The spec has **42** ACs (report 0002 also says 42). The test-report table has 42 rows | **Failed** (count wrong; see F-08) |
| Partial ACs are 2.3, 9.1, 10.2, 11.1, 11.2 (0004) | The test report marks 9.1 as "Covered (logic)", so the two documents disagree | Partially (F-08) |
| CI run 41356126723 on 5ee6bbd succeeded (0004) | I cannot open it. The workflow file is correct: path-filtered, `contents: read`, no secrets, runs `npm ci`, `npm test`, `build:preview`. The test report still says "Not run on GitHub yet" | Not verified (claim only) |
| Bug B1 fixed with a regression test (test report) | Guard `if (isExpired(room, client.now())) return` is present in `GameScreen.tsx`; the test `AC-3.4 an expired (idle > 24 h)…` passes. I did not repeat the stash experiment | Verified (fix present, test passes) |
| Playwright check: local mode, 360 px, light/dark, EN/AR, two tabs, no console errors (0003) | No artifact, log or screenshot is in the repo | Not verified |
| "Realtime transport at $0 behind an interface" (0001 build AC) | `Transport` interface with `MqttTransport`, `BroadcastTransport` and `MemoryTransport` (`src/lib/transport.ts`). Public broker, no credentials, no account | Verified |

## Claims vs evidence: acceptance criteria

**What the verdicts mean.**
- **Verified:** a named test exists, it passed in my re-run, and I inspected the code path.
- **Partially:** part of the AC can only be checked in a real browser, on a device, or on the live broker.

**Caveat for every multi-player AC.** All automated tests use the in-process `MemoryBroker`. Live delivery over the public MQTT broker is unverified (F-01).

| AC | Claim | Evidence (test in `app/src/test/` / code) | Verdict |
|---|---|---|---|
| AC-1.1 | Empty or whitespace name is blocked inline | us1-name `AC-1.1 empty or whitespace-only…`; `validateName` in `lib/name.ts`; `role=alert` and `aria-invalid` in `NameForm.tsx` | Verified |
| AC-1.2 | More than 20 characters after trim is blocked | us1 `AC-1.2…`; `nameLength` counts code points (`lib/room.ts`) | Verified |
| AC-1.3 | Name is prefilled on revisit and can be changed | us1 `AC-1.3…`; `prefs.ts` uses localStorage | Verified |
| AC-2.1 | Unique id, host seated as X, waiting screen and link | us2 `AC-2.1…`; `createRoom`; `newRoomId` uses `crypto.getRandomValues` | Verified |
| AC-2.2 | Copy link with confirmation | us2 `AC-2.2 Copy link…` and the failure test; `ShareBox.tsx` | Verified |
| AC-2.3 | Native share opens; button hidden when unsupported | us2 `AC-2.3…` (both). The native sheet itself was not exercised | Partially |
| AC-2.4 | Created game is listed in the lobby | us2 `AC-2.4…`; `openGames` | Verified |
| AC-3.1 | Join as O; both see the board; X starts | us3 `AC-3.1…`, us7 `AC-7.3…`; `joinRoom` | Verified |
| AC-3.2 | Name is asked for first, then the player joins | us3 `AC-3.2…` | Verified |
| AC-3.3 | Reopening the link returns the player to their seat | us3 `AC-3.3…`; `seatOf` reclaims by clientId | Verified |
| AC-3.4 | Unknown or expired game shows "Game not found" | us3 `AC-3.4…` (3 tests); 5 s timer and `isExpired` in `GameScreen.tsx` | Verified |
| AC-4.1 | Mark placed, turn passes, opponent sees it | us4 `AC-4.1…`; `moveRoom` | Verified (in-memory) |
| AC-4.2 | Occupied cell changes nothing | us4 `AC-4.2…` (broker payload byte-identical) | Verified |
| AC-4.3 | Not my turn: nothing changes, turn is shown | us4 `AC-4.3…`; `canPlay` and `aria-disabled` in `Board.tsx` | Verified |
| AC-4.4 | Round over: nothing changes | us4 `AC-4.4…` | Verified |
| AC-5.1 | Winner shown by name; winning line highlighted | us5, 3 tests. The winner's own screen says "You win!" and the name is on the player card (O3). I accept this interpretation | Verified |
| AC-5.2 | Draw shown on both screens | us5 `AC-5.2…` | Verified |
| AC-5.3 | Score updates exactly once | us5 `AC-5.3…`; `scoredRound` guard | Verified |
| AC-6.1 | Locked screen with no board controls | us6 `AC-6.1…`; `GameScreen.tsx` shows the locked `MessageScreen` | Verified |
| AC-6.2 | A locked visitor cannot change the game | us6 `AC-6.2…`. The test is weak: the visitor has no controls to press. `joinRoom` and `moveRoom` reject non-seated clients. A malicious client on the broker can still change the game (out of scope, F-02) | Verified (honest clients only) |
| AC-7.1 | Lobby shows host name and created time | us7 `AC-7.1…` (2 tests) | Verified |
| AC-7.2 | Full games and games idle more than 10 min are hidden | us7 `AC-7.2…`; `openGames` uses `updatedAt` (F-05) | Verified (literal reading) |
| AC-7.3 | Join from the lobby | us7 `AC-7.3…` | Verified |
| AC-7.4 | Empty state with "Create game" | us7 `AC-7.4…` | Verified |
| AC-7.5 | Lobby updates without a reload | us7 `AC-7.5…` (fake clock); `useNow(15_000)` in `Lobby.tsx` | Verified |
| AC-8.1 | Both players must press "Play again" | us8 `AC-8.1…`; `rematchVote` | Verified |
| AC-8.2 | Starting player alternates | us8 `AC-8.2…`; `starterForRound` | Verified |
| AC-8.3 | Score by name, including draws, across rounds | us8 `AC-8.3…` | Verified |
| AC-8.4 | Reload keeps board and score | us8 `AC-8.4…` (retained state) | Verified (in-memory) |
| AC-9.1 | Opponent shows offline after about 15 s | us9, 3 tests (fake clock, heartbeat, Will/pagehide); `watchPresence`, `OFFLINE_AFTER_MS`. The real broker's Last Will timing (keepalive 10 s × 1.5) is unverified | Partially |
| AC-9.2 | An offline seat stays locked to strangers | us9 `AC-9.2…` | Verified |
| AC-9.3 | Returning player retakes the seat | us9 `AC-9.3…` | Verified |
| AC-10.1 | Connecting / online / offline indicator | us10 `AC-10.1…`; `StatusPill.tsx` | Verified |
| AC-10.2 | Offline disables moves; automatic reconnect | us10, 2 tests (UI, plus mocked `mqtt` events and `reconnectPeriod: 2000`). Real network loss was not tested | Partially |
| AC-10.3 | Local mode: two tabs play without the broker | us10 `AC-10.3…`: two `BroadcastTransport`s in one jsdom, not two real tabs. The two-tab claim in 0003 is not verified | Partially |
| AC-11.1 | Marks, win line and screens animate | us11: hooks and keyframes are present. jsdom does not play animations | Partially |
| AC-11.2 | Reduced motion: animations removed or turned into fades; all functions work | us11, 2 tests. The `prefers-reduced-motion` block (`index.css:1192`) sets 0.01 ms durations, draws strokes fully, hides confetti and blobs, and turns screen changes into fades. Real rendering is unverified | Partially |
| AC-12.1 | Arabic and RTL, persisted | us12 `AC-12.1…` (2 tests); `index.html` pre-paint script | Verified |
| AC-12.2 | Language follows the browser; English fallback | us12 `AC-12.2…` (2 tests) | Verified |
| AC-12.3 | Arrow keys move focus; Enter places a mark | us12 `AC-12.3…` (2 tests); roving tabindex in `Board.tsx` | Verified |
| AC-12.4 | Cell labels in the current language | us12 `AC-12.4…`; `cellLabel` in both languages | Verified |
| AC-12.5 | Live region announces turns and results | us12 `AC-12.5…` (2 tests); `Announcer.tsx` | Verified |

**Totals:** 42 ACs. 36 verified (several only in-memory or with the noted qualifications), 6 partially (2.3, 9.1, 10.2, 10.3, 11.1, 11.2), 0 not verified.

## Rule checks

- **Public repository: passed.**
  - I searched the project for keys, tokens, passwords, private keys and e-mail addresses. Nothing was found.
  - There is no `.env` file, and `.gitignore` excludes `*.local` and `dist`.
  - Git history for `projects/xo-online` has a single author, `Claude <noreply@anthropic.com>`.
  - There are no fixtures holding real names. Tests use Alice, Bob and Carol. The client is "Internal — CEO".
- **$0: passed.**
  - The app uses the free public broker `broker.hivemq.com` over WSS, with no credentials and no account.
  - Dependencies are open-source npm packages with 0 audit findings.
  - CI is one ubuntu job on the free tier (15-minute timeout).
- **Message handling on a public broker: mostly sound, with gaps in F-02 and F-03.**
  - `parseRoom` rejects payloads that are empty or longer than 8192 characters, and rejects invalid JSON.
  - It checks `schema`, the id regex `^[a-z0-9]{6,16}$`, that the id matches the topic, the clientId regex, and names of 1–20 code points after normalisation.
  - It checks a board of 9 cells containing only X, O or null, finite or integer numbers, booleans, the status enum, a win line with exactly 3 entries ≤ 8, and that the two seats have distinct clientIds.
  - Presence payloads are capped at 200 characters and type-checked. Handler exceptions are caught in `dispatch`.
- **XSS: no exposure found.**
  - No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write` or `insertAdjacentHTML` appear in `src/` or `index.html`.
  - Every name is rendered as a React text child or attribute value, so React escapes it.
  - The share URL is built from a validated id. Routes are validated by `ID_RE`.

## Findings

| ID | Severity | Finding and evidence | Expected change | Owner |
|---|---|---|---|---|
| F-01 | Medium | **Live MQTT is unverified.** No test or person has exercised `MqttTransport` against the real broker from this sandbox (R3). Unverified as a result: cross-device play, N1 latency of about 1 s, real retained-message delivery, Last Will timing, and reconnect after real network loss. Every multi-player AC rests on the in-memory broker. | After the CEO publishes the preview: a manual two-device check (two networks), covering create, join, a full round, rematch, a locked third device, closing a tab (offline within about 15 s) and toggling airplane mode (reconnect). Record the date, browsers and devices. | EMP-011 (manual QA), CEO on the preview |
| F-02 | Medium | **Spoofed messages are only shape-checked, not bounded.** `parseRoom` accepts any finite `version`, `updatedAt`, `createdAt`, `lastSeen` and score values, and does not check that board, turn and result are consistent. My analysis of the code, not run: (a) a message with `version` near 2^53 and a far-future `updatedAt` freezes a room, because `version + 1` stops increasing and `compareRooms` then prefers the spoofed `updatedAt`; (b) a waiting room with a future `updatedAt` stays in the lobby indefinitely, because `now - updatedAt` is negative in `openGames`; (c) `Lobby` renders every open game without a cap. Anyone can therefore fill the public lobby on our domain with arbitrary 20-character names. Anti-cheat is out of scope in the spec, but lobby flooding and offensive content are a reputational risk once the URL is public. | Before production: reject `updatedAt`/`createdAt` more than about 5 min in the future; cap `version`; cap the lobby list (for example 20 entries); optionally check board/turn consistency. Not a blocker for a CEO-only preview. | EMP-008 (fix), EMP-006 (review) |
| F-03 | Medium | **Expiry clean-up trusts each visitor's local clock.** In `watchLobby` (`client.ts`), any lobby viewer publishes an empty retained payload for any room `isExpired` by its own clock. A visitor whose device clock is 24 h or more ahead would clear every live room. Seated players then receive `''`: `ingest` deletes the room, they see "Game not found", and the game is lost. EMP-006 accepted this as Low. I rate it Medium because an honest user can trigger it and it destroys other people's games. | Clear a room only when it is expired relative to a sanity bound, for example the newest `updatedAt` seen across rooms or broker receipt time; or let only seat holders clear; or have a seated client re-publish its state when it receives `''` for a room it is playing. | EMP-008 |
| F-04 | Medium | **Assumptions A1–A6 are still unconfirmed by the CEO** (spec, PROJECT.md open questions 1–6). A1 (public broker; names and games readable by anyone; public lobby) is load-bearing for the whole architecture and for F-02. | The CEO confirms or amends A1–A6, at the latest together with the preview approval. | CEO (answer), EMP-003 (record) |
| F-05 | Low | **Lobby idleness uses the last room update, not presence (O2).** A host actively waiting on the waiting screen drops out of the lobby after 10 minutes, although the link still works. This matches the literal A2. | Product decision. If "idle" means "host gone", let the host's heartbeat refresh lobby freshness. | CEO / EMP-002 (decision), EMP-008 (if changed) |
| F-06 | Low | **Bidi isolation of names (O4).** Names inside translated sentences are not isolated (for example `theirTurn`, `winnerIs` and `waitingFor` in `i18n.ts`; the turn heading; the live region; the result line). `Lobby.tsx:93` wraps the whole sentence `t.hostedBy(name)` in `<bdi>` rather than only the name. `normalizeName` does not strip bidi control characters (U+202A–202E, U+2066–2069), so a name can reorder the text around it. | Wrap each interpolated name in `<bdi>` (or FSI…PDI in plain strings and the live region). Strip bidi control characters in `normalizeName`. | EMP-008 |
| F-07 | Low | **Animations and reduced motion are checked only by stylesheet inspection (AC-11.x).** The CSS looks correct, but real playback and the OS setting have not been observed. | Visual check on the preview with reduced motion off and on (for example macOS Accessibility settings or DevTools emulation). | EMP-011 |
| F-08 | Low | **Inaccurate claims in the test evidence.** The test report says "48 total: 43 covered, 5 partial", but the spec has 42 ACs. The partial lists differ between the test report (AC-9.1 "Covered (logic)") and report 0004 (AC-9.1 partial). The test report says CI was "Not run on GitHub yet", while 0004 claims run 41356126723 succeeded. The PROJECT.md Status line is stale ("build in progress"). The QA approval (EMP-010) did not catch the count. | Correct the AC count and partial list in `docs/test-report.md`; add the CI run reference; update the PROJECT.md Status. | EMP-012, EMP-003 |
| F-09 | Low | **Privacy wording and broker hygiene.** The name form says the name "is shown to your opponent and in the lobby". It does not say that game messages travel through a public broker that anyone can read, and that they are retained. Retained presence/Will topics (`presence/_/<clientId>`, `presence/<room>/<clientId>`) are never cleared, except the room heartbeat on Leave, so they accumulate on the public broker. | Add one line, for example "Games use a public server; anyone could see names and moves." Optionally clear retained presence on leave/pagehide. | EMP-008, EMP-002 (wording) |
| F-10 | Low | **Seat-race window.** Two visitors joining a waiting room at the same moment both commit `version + 1`. `compareRooms` breaks the tie deterministically and the loser converges to the locked screen. A late write from a stale state can briefly override. EMP-006 accepted this. | Include a near-simultaneous join from two devices in the F-01 manual check. No code change needed for the preview. | EMP-011 |

**Counts: High 0, Medium 4 (F-01 to F-04), Low 6 (F-05 to F-10).**

## Unverified items

- Live public MQTT behaviour: cross-device play, latency (N1), Last Will, reconnect (F-01).
- GitHub CI run 41356126723 on 5ee6bbd: claim only, I cannot open it. CI uses Node 24; my run used Node 22.23.4.
- The Playwright browser check claimed in report 0003 (no artifact).
- The native share sheet on a phone (AC-2.3); local mode in two real tabs (AC-10.3).
- Real animation and reduced-motion rendering (AC-11.x).
- N3 (WCAG AA contrast) and N5 (360 px layout): no automated or recorded check exists.
- The B1 "fails without the fix" experiment: not repeated by me.

## Release recommendation (preview only)

**Go with conditions** for the CEO-run "Publish previews". This is not a recommendation for production or any wider public announcement.

Conditions:
1. **CEO decision on F-04 (A1 at minimum).** When approving the preview, the CEO confirms that a public, unauthenticated broker and an open lobby, which anyone can read and write to, are acceptable at the preview URL. A2–A6 should be confirmed at the same time.
2. **Manual check after publish (F-01, F-07, F-10).** Once the preview is published, EMP-011, or the CEO with EMP-011's checklist, runs the two-device live check plus the reduced-motion check and records real dates, devices and results. Until that is done, live play is "unverified", not "passed".
3. **Correct the evidence (F-08)** before the next report to the dashboard. This does not block the preview.

Before any production release I would expect F-02 and F-03 to be fixed, F-06 and F-09 to be addressed, and conditions 1–2 to be complete.

The publish itself is a protected public-release action. EMP-003 prepares it for the CEO Approval Center; nobody else performs it.
