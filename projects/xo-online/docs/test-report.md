# xo-online: Test report (EMP-012, 2026-11-01, corrected 2026-11-02)

**Correction (2026-11-02, review condition 3 / F-08).** The first version said "48 ACs: 43 covered, 5 partial" and "CI not run on GitHub yet". Both were wrong. `docs/spec.md` has **42** ACs (AC-1.1 … AC-12.5, counted by unique id). Six are partial (AC-2.3, 9.1, 10.2, 10.3, 11.1, 11.2), the same list as `docs/review.md`. CI did run on GitHub (see "CI").

**Scope.** Automated acceptance tests for every AC in `docs/spec.md` (US-1..US-12), CI workflow, and one bug fix.
**Stack.** Vitest 5 + Testing Library + jsdom. Each mounted `<App>` is one "browser" (its own localStorage namespace and memory router). Several apps share one in-process `MemoryBroker` (retained messages, Last Will), so multi-player flows run without a network. Fake timers (`setTimeout/setInterval/Date`; `queueMicrotask` stays real) cover the 15 s offline, 5 s not-found and 10 min lobby-idle thresholds. No retries are used to make tests pass. Three tests (AC-5.3, AC-6.2, AC-8.1) wait a short real `setTimeout(20)` before asserting that nothing changed; these waits cannot force a pass.
**Not covered by any automated test:** the live public MQTT broker (R3: this sandbox cannot reach it), real CSS animation playback, and the native share sheet on a device. These need the CEO's preview check plus manual QA (EMP-011).

## Result summary

| Item | Result |
|---|---|
| Test files | 18 (16 from 2026-11-01 + `src/lib/review-fixes.test.ts` + `src/test/review-fixes.test.tsx`) |
| Tests | 107 passed / 0 failed / 0 skipped at commit dda7125 (88 on 2026-11-01, +19 for the review fixes) |
| Stability | 3 consecutive full runs at dda7125, all green: 16.79 s, 21.52 s, 19.17 s (Node 22.23.4) |
| Build | `npm run build:preview` with `BASE_PATH=/agency-projects/xo-online/` exit 0 on 2026-11-02; `dist/` deleted afterwards |
| Lint | `npx oxlint` exit 0 (2026-11-01; not re-run on 2026-11-02) |
| ACs | 42 total: 36 covered, 6 partial (AC-2.3, 9.1, 10.2, 10.3, 11.1, 11.2), 0 not covered |
| Real browser | Chromium (Playwright) check of local mode on 2026-11-02: 14/14 checks passed, 3 consecutive runs, 0 console errors (see "Real-browser check") |

## AC → test mapping

Files are in `app/src/test/`. "Partial" means the observable hook is tested, but part of the AC can only be checked in a real browser, device or broker (see "why").

| AC | Status | Test(s) (`it(...)` name starts with the AC id) | Notes / why partial |
|---|---|---|---|
| AC-1.1 | Covered | us1-name: `AC-1.1 empty or whitespace-only…`; journey | Inline `role=alert`, `aria-invalid`, nothing saved |
| AC-1.2 | Covered | us1-name: `AC-1.2 …longer than 20…` | 21 blocked, 20 trimmed accepted, Arabic counted by code points |
| AC-1.3 | Covered | us1-name: `AC-1.3 …prefilled on revisit and can be changed` | Change persists across a second revisit |
| AC-2.1 | Covered | us2-create-share: `AC-2.1 …` | Unique id, seat X, waiting screen, link `…/#/game/<id>`, retained state |
| AC-2.2 | Covered | us2: `AC-2.2 Copy link…`, `AC-2.2 when copying fails…` | Clipboard contents read back; confirmation + live region; failure fallback |
| AC-2.3 | **Partial** | us2: `AC-2.3 with Web Share…`, `AC-2.3 without Web Share…` | `navigator.share` called with url/text; button hidden when absent. The native sheet itself is device-only |
| AC-2.4 | Covered | us2: `AC-2.4 …listed in the lobby` | |
| AC-3.1 | Covered | us3-join: `AC-3.1 …`; us7 `AC-7.3` | Seat O, both see board, X first, broker state `playing` |
| AC-3.2 | Covered | us3: `AC-3.2 without a saved name…` | Not joined until the name is entered |
| AC-3.3 | Covered | us3: `AC-3.3 reopening the link…` | Both players reclaim their seats; no new write |
| AC-3.4 | Covered | us3: `AC-3.4 …after 5 s…` (fake clock 4.9 s / 5.1 s), `AC-3.4 the default not-found wait is 5 s`, `AC-3.4 an expired (idle > 24 h) or cleared game…` | Includes the regression for bug B1 below |
| AC-4.1 | Covered | us4-turns: `AC-4.1 …` | Mark, turn passes, opponent sees it |
| AC-4.2 | Covered | us4: `AC-4.2 …occupied cell…` | Broker payload byte-identical |
| AC-4.3 | Covered | us4: `AC-4.3 …not my turn…` | All cells `aria-disabled`; active player highlighted |
| AC-4.4 | Covered | us4: `AC-4.4 after the round is over…` | Both players tried |
| AC-5.1 | Covered | us5-result: 3 tests (all 8 lines; X win on both screens with `cell--win` + SVG win line; O win) | The winner's own screen says "You win!", and their name is on their player card (see O3) |
| AC-5.2 | Covered | us5: `AC-5.2 …"Draw" on both screens` | Also: a winning last move on a full board counts as a win |
| AC-5.3 | Covered | us5: `AC-5.3 …exactly once…` | Score still 1 after both clients reconnect and get the final state again |
| AC-6.1 | Covered | us6-locked: `AC-6.1 …` | No board, cells, Play again or Leave; lobby link works |
| AC-6.2 | Covered | us6: `AC-6.2 …nothing the locked visitor does…` | Broker payload unchanged after interaction and reload; model rejects the visitor's moves |
| (regression) | Covered | us6: `regression (James, GameScreen join retry)…`, `regression (join retry): when X leaves…` | A visitor on the locked screen takes seat O when it frees up, with no reload |
| AC-7.1 | Covered | us7-lobby: `AC-7.1 …host name and created time`, `AC-7.1 relative created time…` (fake clock, "Created 3 minutes ago") | `<time datetime>` checked |
| AC-7.2 | Covered | us7: `AC-7.2 …` (model, 10 min boundary), `AC-7.2/7.5 (UI) a full game is not listed…` | See O2 |
| AC-7.3 | Covered | us7: `AC-7.3 …` | |
| AC-7.4 | Covered | us7: `AC-7.4 …empty state…` | The empty-state "Create game" button works |
| AC-7.5 | Covered | us7: `AC-7.5 …created, filled, or go stale` (fake clock) | One mounted lobby, no reload |
| AC-8.1 | Covered | us8-rematch: `AC-8.1 …` | "Waiting for Bob…"; opponent sees "Alice wants to play again"; round 1 kept until both vote |
| AC-8.2 | Covered | us8: `AC-8.2 …alternates…` | Rounds 1/2/3 start with X/O/X in the UI |
| AC-8.3 | Covered | us8: `AC-8.3 …` | Alice 1, Bob 0, draws 1, by name, across rounds |
| AC-8.4 | Covered | us8: `AC-8.4 …reload…` | Mid-round board, round, turn and score unchanged |
| AC-9.1 | **Partial** | us9: `AC-9.1 …closes the tab…` (fake clock: online at 13 s, offline after 15 s), `AC-9.1 heartbeats keep…`, `AC-9.1 …Last Will… or pagehide…`; journey | Logic covered. The real broker's Last Will timing is not verified (no live broker) |
| AC-9.2 | Covered | us9: `AC-9.2 …` | |
| AC-9.3 | Covered | us9: `AC-9.3 …` | Retakes seat, presence back online, plays a move; a different browser with the same name is locked |
| AC-10.1 | Covered | us10-connection: `AC-10.1 …` | `connecting` (deferred transport) → `online` → `offline` → `online`, on lobby and game screens |
| AC-10.2 | **Partial** | us10: `AC-10.2 offline disables…`, `AC-10.2 the MQTT transport…reconnects…` (mocked `mqtt`) | UI disables actions and nothing is published while offline. `MqttTransport` maps offline/reconnect/connect events, `reconnectPeriod > 0`, and resubscribes. Real network loss against the live broker is not tested |
| AC-10.3 | **Partial** | us10: `AC-10.3 …two tabs…` | Two `BroadcastTransport`s (Node BroadcastChannel) + shared localStorage play a full round; MemoryBroker stays empty. Not exercised in real tabs by the suite; the 2026-11-02 Chromium check played a full game in local mode across tabs (manual evidence, script not in the repo) |
| AC-11.1 | **Partial** | us11-animation: `AC-11.1 placed marks are SVG strokes…`, `AC-11.1 screens enter…` | Checks the stroke SVGs (`pathLength=1`), win-line SVG, `enter` class, and `@keyframes draw/screen-in` in the CSS. jsdom does not play animations |
| AC-11.2 | **Partial** | us11: `AC-11.2 …stylesheet check`, `AC-11.2 all functions still work…` | Checks the `prefers-reduced-motion` block (0.01 ms animations, strokes drawn, confetti/blobs hidden, screens fade) and a full win + rematch with `matchMedia` reporting reduced motion. jsdom does not evaluate media queries |
| AC-12.1 | Covered | us12: `AC-12.1 every UI string has an Arabic translation`, `AC-12.1 choosing Arabic…persists on reload`; journey | Scans the name form, lobby and game screen for leftover Latin text (player names and X/O allowed); `dir=rtl`, `lang=ar`, title; persists |
| AC-12.2 | Covered | us12: `AC-12.2 …` (detectLang), `AC-12.2 (UI)…` | ar-SA → Arabic, fr-FR → English, saved choice overrides browser |
| AC-12.3 | Covered | us12: `AC-12.3 arrow keys…`, `AC-12.3 in Arabic…LTR positions`; journey | Roving tabindex, edge clamping, Enter places a mark, Enter on an occupied cell does nothing |
| AC-12.4 | Covered | us12: `AC-12.4 …` | All 9 English labels; Arabic labels after switching |
| AC-12.5 | Covered | us12: `AC-12.5 …turn changes and results`, `AC-12.5 a draw is announced…` | `role=status aria-live=polite`; join, turns, win, lose, draw (EN + AR) |

## Bugs and observations

- **B1 (fixed, trivial, in `app/src/components/GameScreen.tsx`).** Opening a link to an **expired** waiting game (idle > 24 h) seated the visitor as O. The join effect ran before the expiry check, so the commit refreshed `updatedAt` and brought the game back instead of showing "Game not found" (AC-3.4). Fix: the join effect returns early when `isExpired(room)`. This is a 2-line guard. Regression test: us3 `AC-3.4 an expired…`. I confirmed it **fails without the fix** (`git stash` of the component → 1 failed) and passes with it. Owner for review: Frontend/Tech Lead.
- **O2 (now F-05, fixed 2026-11-02; see "Review fixes"). Was: spec question for EMP-002 / CEO, not changed).** Lobby idleness is measured on the room's `updatedAt`. Presence heartbeats do not refresh it, so a host who is **actively waiting** on the waiting screen drops out of the lobby after 10 minutes (seen in us7 `AC-7.5`). This matches the literal "idle > 10 minutes" rule (A2). If "idle" should mean "host gone", the host's heartbeat would need to refresh lobby freshness.
- **O3 (interpretation).** AC-5.1 "both screens show the winner by name": the loser sees "Alice wins", while the winner sees "You win!" with their name on the player card. I treated this as meeting the AC; flagged for the QA Manager.
- **O4 (now F-06, fixed 2026-11-02; see "Review fixes"). Was: low, a11y/bidi, route to Frontend.** Player names inside translated sentences (turn heading, live region, e.g. `دور Alice`) are not bidi-isolated (`<bdi>`/FSI). The lobby and player cards do use `<bdi>`. Mixed-script names that contain punctuation may display in the wrong order. Not covered by a failing test because the spec does not state it.

## Commands run (real output tails)

All commands ran in `projects/xo-online/app` (Node 22.23.4 from the sandbox, deps already installed).

2026-11-02, at commit dda7125 (clean working tree):

```
$ npm test            # run 1 of 3 (runs 2 and 3 identical apart from timing: 21.52 s, 19.17 s)
 Test Files  18 passed (18)
      Tests  107 passed (107)
   Duration  16.79s (tests 56%, environment 35%, setup 6%, import 3%, transform 1%)
```

Note: three earlier runs the same afternoon failed 1–2 tests (`F-02 the lobby lists at most LOBBY_MAX games…`, `F-09 the name screen and the footer…`). They ran while commits 75c25d3 (Edward's privacy wording) and dda7125 (`MAX_FUTURE_SKEW_MS` 2 → 10 min) were being written, so the tests and the source briefly disagreed. After both landed: 3 full runs green, and `src/test/review-fixes.test.tsx` 5 isolated runs green (4/4 each). I do not treat these as flaky, but I will watch for them in CI.

```
$ BASE_PATH=/agency-projects/xo-online/ npm run build:preview
dist/index.html                     1.76 kB │ gzip:  0.84 kB
dist/assets/index-NnQHA5Cb.css     18.26 kB │ gzip:  4.98 kB
dist/assets/index-D1y5XJiv.js     264.28 kB │ gzip: 83.08 kB
dist/assets/mqtt.esm-BZmp_r8e.js  329.99 kB │ gzip: 98.79 kB
✓ built in 770ms
$ rm -rf dist
```

2026-11-01 (first version of this report):

```
$ npm test            # run 1 of 3 (runs 2 and 3 identical apart from timing: 11.47 s, 11.10 s)
 Test Files  16 passed (16)
      Tests  88 passed (88)
   Duration  10.92s (tests 58%, environment 32%, setup 6%, import 2%, transform 1%)
```

```
$ npm run build:preview
✓ 39 modules transformed.
dist/index.html                     1.68 kB │ gzip:  0.82 kB
dist/assets/index-CAaW12EO.css     18.16 kB │ gzip:  4.95 kB
dist/assets/index-C3WptP98.js     261.63 kB │ gzip: 82.19 kB
dist/assets/mqtt.esm-BZmp_r8e.js  329.99 kB │ gzip: 98.79 kB
✓ built in 550ms
$ rm -rf dist
```

```
$ npx oxlint
(exit 0)
```

## CI

`.github/workflows/xo-online.yml` is copied from `todo-app.yml` (actions/checkout@v7, actions/setup-node@v7, Node 24, npm cache). It triggers on push to `project/xo-online` and on pull_request, path-filtered to `projects/xo-online/**` plus the workflow file, and also on `workflow_dispatch`. It has `permissions: contents: read`, a single ubuntu job with a 15-minute timeout, and runs `npm ci`, `npm test` and `npm run build:preview` in `projects/xo-online/app`. It uses no secrets. One job takes about 1–2 minutes, well within the free tier. Vitest has no traces; a failure prints the assertion with the DOM dump in the job log.

**GitHub runs (workflow "xo-online CI", checked with `gh run view` / `gh run list` on 2026-11-02):**

| Run | Commit | Trigger | Result |
|---|---|---|---|
| 41355320188 | 383c81e | push, 2026-11-01 22:05 UTC | success |
| 41356126723 | 5ee6bbd | push, 2026-11-01 22:14 UTC | success |
| 41508386626 | 47ba2e5 (review fixes) | push, 2026-11-02 19:16 UTC | success |
| 41508718219 | 75c25d3 | push, 2026-11-02 19:18 UTC | success |
| 41509016902 | dda7125 | push, 2026-11-02 19:20 UTC | success |

## Known gaps

1. **Live MQTT (public broker over WSS) is unverifiable from this sandbox** (R3). Cross-device delivery, N1 latency (~1 s), broker-side Last Will timing, retained-message behaviour of the real broker and reconnect after real network loss all need the CEO-approved preview plus a manual two-device check (EMP-011).
2. Real animation playback and reduced-motion rendering (AC-11.x) need a visual check in a browser with the OS setting on and off.
3. Native share sheet (AC-2.3) needs a check on a phone.
4. Local test mode is tested in the suite with two transports in one jsdom. Real tabs were checked once by hand in Chromium (2026-11-02, see below); that check is not in CI.
5. Not done yet: a committed Playwright E2E suite (cross-browser, in CI) and contrast (N3) checks. They can run on free GitHub runners. The 360 px check (N5) was done once in Chromium only.

## Review fixes (2026-11-02)

Fixes by EMP-008 in commit 47ba2e5, tightened in dda7125 (peer clock skew allowed up to 10 min). 19 tests, all passing at dda7125. `L` = `app/src/lib/review-fixes.test.ts` (15 tests), `U` = `app/src/test/review-fixes.test.tsx` (4 tests).

| Finding | What the tests check | Tests |
|---|---|---|
| F-02 spoofed messages are bounded | `version` is a safe integer in 1…`VERSION_MAX`; honest peers up to a few minutes ahead are accepted; timestamps more than `MAX_FUTURE_SKEW_MS` ahead, negative or non-finite are rejected; scores, rounds and board are in range and consistent; a version may not jump more than `MAX_VERSION_JUMP`; lobby shows at most `LOBBY_MAX` games, newest first, no future-dated ones; `XoClient` ignores a spoofed jump and a seated player restores the state; at most `MAX_ROOMS` rooms in memory | L: 8 tests named `F-02 …` |
| F-03 lobby viewers never delete rooms | A viewer whose clock is 25 h ahead hides old rooms but publishes no clearing payload | L: `F-03 a viewer whose clock is 25 h ahead…` |
| F-05 an online waiting host stays listed | `touchWaitingRoom` refreshes `updatedAt` without a version bump, only for a lone host; `keepWaitingRoomFresh` keeps the room in `openGames` past `LOBBY_IDLE_MS`; UI: the host is still listed after more than 10 min | L: 2 tests `F-05 …`; U: `F-05 a waiting host who stays online…` |
| F-06 bidi-safe names | Bidi and control characters stripped from typed and received names; `isolate`/`splitIsolates` (FSI…PDI); `<bdi>` in lobby titles, turn heading and live region | L: 3 tests `F-06 …`; U: 2 tests `F-06 …` |
| F-09 privacy and presence hygiene | `goOffline` (pagehide) clears this client's retained room heartbeats; name screen and footer say a free public server is used (EN and AR) | L: `F-09 pagehide (goOffline)…`; U: `F-09 the name screen and the footer…` |

Not covered by these tests: whether the public broker actually drops the cleared retained topics (F-09), and real clock skew between two devices (F-02/F-03). Both belong in the F-01 manual two-device check (EMP-011).

## Real-browser check (2026-11-02, manual evidence, not in CI)

Chromium via the sandbox's preinstalled Playwright, against `vite preview --base /agency-projects/xo-online/` of the build above, `?transport=local`, 360×740 viewport. The script was kept outside the repository. 3 consecutive runs, 14/14 checks passed each time:

1. A enters a name and creates a game; share link `…/?transport=local#/game/<id>`: pass.
2. A lobby in another tab lists "Join Alice's game": pass.
3. B opens the share link, enters a name, full game (X wins the top row); A sees "You win!", B sees "Alice wins": pass.
4. Both press Play again: Round 2, empty board, B (O) to move, score Alice 1 / Bob 0 on both: pass.
5. A third tab opening the link sees "This game is locked", no board: pass.
6. Arabic: `dir=rtl`, `lang=ar`, Arabic privacy note visible: pass.
7. `prefers-reduced-motion: reduce`: full game to a win works; longest computed animation 0.2 s (screen fade, allowed by AC-11.2): pass.
8. No horizontal scroll at 360 px on the name, lobby, waiting, game, locked and Arabic name screens: pass.
9. Console errors and page errors over all tabs: none.
