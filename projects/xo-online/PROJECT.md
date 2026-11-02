# xo-online

| Field | Value |
|---|---|
| Client | Internal — CEO |
| Key | xo-online |
| Type | Quick app |
| Branch | project/xo-online |
| Repo | https://github.com/mohamad-ilyas/agency-projects/tree/project/xo-online/projects/xo-online |
| Preview | https://mohamad-ilyas.github.io/agency-projects/xo-online/ (live since 2026-11-01, Publish previews run 41356781424) |
| Project manager | EMP-003 Sarah Mitchell |

## Request (CEO)

> Build a simple xo game that can be played with two players online using a shared link and it will require the users to enter thier names and if two players are on same link and other tried to open it will show that this is locked and also if i opened the game url the normal users can see available games to join and replay with same player available amd the score. Make the ui proffisional and fully animated. This is a web game

## Assumptions

- Vite + React + TypeScript static site on GitHub Pages; no server of our own.
- Realtime online play at $0 with no accounts uses a free public MQTT broker over secure WebSockets (default `wss://broker.hivemq.com:8884/mqtt`, configurable via `VITE_BROKER_URL`). Game and lobby state use retained messages.
- A same-browser BroadcastChannel mode is available for local testing.
- Share links are hash-based (`#/game/<id>`) because GitHub Pages has no server routing.
- Player names and game state travel through a public broker. No personal data beyond a chosen display name. Anyone could technically read or spoof messages: acceptable for a casual game, not for anything sensitive.
- No accounts. No persistence beyond the broker's retained messages, plus localStorage for the player's own name.
- Arabic (RTL) and English with a language switch (house rule).
- $0: no paid services, APIs, or dependencies requiring a subscription.
- Preview served at /agency-projects/xo-online/ (build base path must match).
- Public repository: no secrets, credentials, or personal data in code, fixtures, or screenshots.
- Session note: the build session's network cannot reach the public broker. Live online play is verified only by the CEO on the preview. Automated tests use an in-memory transport.

## Open questions (unanswered — for the CEO)

1. Is relying on a free public broker (no SLA, data visible to anyone) acceptable, or should we request approval for a free-tier hosted backend?
2. How long should idle games stay listed in the lobby? (Assumed: 10 minutes.)
3. Who starts the next round in a rematch? (Assumed: the starting player alternates each round.)
4. Should spectators be able to watch a locked game? (Assumed: no — they see a locked screen.)
5. Default language? (Assumed: follow the browser, English fallback.)
6. When is a player shown offline, and who can reclaim a seat? (Assumed, EMP-002 A6: offline after ~15 s without contact; only the same browser can reclaim a seat.)

Until answered, the spec (xo-online/spec) records these as explicit assumptions for CEO confirmation.

## Checklist

| Task | Owner | Depends on | Reviewer | Status |
|---|---|---|---|---|
| xo-online/setup | EMP-003 Sarah | — | — | done |
| xo-online/spec | EMP-002 Oliver | — | EMP-003 | done |
| xo-online/build | EMP-008 Emily | spec | EMP-006 | done |
| xo-online/tests | EMP-012 George | build | EMP-010 | done |
| xo-online/review | EMP-013 Eleanor | tests | reports to CEO | done — Go with conditions |
| xo-online/preview (protectedAction: public_release) | EMP-003 Sarah | review | CEO decides | done — CEO approved; published 2026-11-01 (run 41356781424); dashboard approval pending |
| xo-online/release (protectedAction: public_release) | EMP-001 Charlotte | review, tests | EMP-013 Eleanor (re-review) | approved 2026-11-02T19:29Z at c93b7b4 (Go with conditions); deploys on the next scheduled Release run; live two-device check pending (EMP-011) |

Approval gate: xo-online/preview is a public release — prepared by EMP-003 and sent to the CEO Approval Center; not performed without explicit CEO approval.

## Status

- **v1 live** at https://mohamad-ilyas.github.io/agency-projects/xo-online/ since 2026-11-01 (preview, Publish previews run 41356781424) and released on `main` 2026-11-02 (COO approval 18:37:56Z, Release run 41502430554: merge and Pages deploy succeeded; only the dashboard report step failed).
- **Follow-up release approved 2026-11-02T19:29Z by EMP-001** at `c93b7b4` (`release.json`). Re-review verdict (`docs/review.md`, EMP-013): **Go with conditions**. Evidence: 107/107 tests (18 files), clean `build:preview` and 0 audit findings, re-run by EMP-013 and EMP-001; xo-online CI green (41508386626, 41508718219, 41509016902, 41509559196, 41510237526); tech-lead (EMP-006) and content (EMP-014) approvals. The scheduled Release workflow (every 15 min) merges and deploys it.
- **Resolved in this release:** F-02 (bounded versions/timestamps/counters, lobby cap 50, 10 min clock-skew tolerance), F-03 (only seated players clear rooms), F-05 (host heartbeat keeps a waiting game listed), F-06 (bidi-isolated names, control characters stripped), F-09 (EN/AR privacy note; retained room heartbeats cleared on leave), F-08 test-report figures and this status section, and the Release workflow delivery-report bug (takes effect from the run after this one). F-04: A1–A6 proceed as documented defaults (CEO instruction 2026-11-02).
- **Product decision N-04 (EMP-001, 2026-11-02):** AC-7.2 "idle" now means "host gone" (host offline / no heartbeat for 10 min), not "no room update for 10 min". Accepted as the intended behaviour.
- **Remaining:**
  1. Live two-device check on the public broker (F-01, F-10, N-01) — EMP-011, right after deploy: two devices on two networks; create, join, full round, rematch, locked third device, tab close (offline in ~15 s), airplane-mode reconnect, near-simultaneous join, one device clock >10 min behind. Live online play stays **unverified** until recorded.
  2. N-02 — this Release run is expected to end red at "Report the final delivery" after Pages deploys; EMP-001 confirms the site and reports the delivery by hand, then checks the next run's report step is green.
  3. Low, non-blocking: N-01 (no hint when a peer clock is >10 min behind; EMP-008 later), N-03 (two name strings not isolated; EMP-008), F-07 (real-device reduced-motion check; EMP-011), F-10 (seat race, part of item 1).
- Rollback: revert the release merge commit on `main`.

## How the CEO publishes the preview

1. GitHub → agency-projects → Actions → **Publish previews** (https://github.com/mohamad-ilyas/agency-projects/actions/workflows/publish-previews.yml) → **Run workflow**.
2. Approve the `github-pages` deployment.
3. The preview appears at https://mohamad-ilyas.github.io/agency-projects/xo-online/.
4. Approve `xo-online/preview` in the dashboard's Approval Center.

Reports: projects/xo-online/reports/0001.json, 0002.json, 0003.json, 0004.json, 0005.json, 0006.json

## Live preview

- URL: https://mohamad-ilyas.github.io/agency-projects/xo-online/ — published 2026-11-01. The CEO asked for it to be published; the workflow was started for them and the CEO approved the github-pages deployment. Run 41356781424 built xo-online from commit 585b4d1; build and deploy succeeded.
- Not yet checked: the page loading in a browser (the build session cannot reach github.io) and live online play between two devices (review condition 2, EMP-011).

## Release 2026-11-02 (follow-up)

- Released by Release run 41510588091: merge cc8eba7 on main, Pages deploy succeeded 19:32 UTC. Live: https://mohamad-ilyas.github.io/agency-projects/xo-online/
- The delivery-report step failed once more, as expected (N-02); the delivery was reported by hand in report 0010. The fixed workflow is now on main.
- Next: EMP-011 runs the live two-device check (including a simultaneous join and a device clock more than 10 min behind). The CEO is asked to test on two devices too.
