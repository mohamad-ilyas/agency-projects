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

Approval gate: xo-online/preview is a public release — prepared by EMP-003 and sent to the CEO Approval Center; not performed without explicit CEO approval.

## Status

- Spec, build, tests and independent review: done. Preview: not published. It is waiting for CEO approval (approval.request `public_release` filed in report 0006).
- Review verdict (`docs/review.md`): **Go with conditions**:
  1. The CEO confirms or amends assumptions A1–A6 — at least A1 (free public broker; open lobby that anyone can read and write).
  2. After publishing, EMP-011 runs a two-device live-broker check and a reduced-motion check, recording dates and devices. Live online play is unverified until then.
  3. EMP-012 corrects the test-report figures (it says 48 ACs, the spec has 42; the partial list and CI statement are out of date). Non-blocking.
- Follow-ups (EMP-008): F-02 bound version/timestamps in `parseRoom` and cap lobby size; F-03 stop a fast client clock from deleting live games; F-06 bidi-isolate player names; F-09 privacy wording must say the broker is public.
- Test evidence: 88/88 tests passed locally (EMP-012 George; re-run by EMP-013 Eleanor). GitHub CI "xo-online CI" runs 41355320188 and 41356126723 succeeded.

## How the CEO publishes the preview

1. GitHub → agency-projects → Actions → **Publish previews** (https://github.com/mohamad-ilyas/agency-projects/actions/workflows/publish-previews.yml) → **Run workflow**.
2. Approve the `github-pages` deployment.
3. The preview appears at https://mohamad-ilyas.github.io/agency-projects/xo-online/.
4. Approve `xo-online/preview` in the dashboard's Approval Center.

Reports: projects/xo-online/reports/0001.json, 0002.json, 0003.json, 0004.json, 0005.json, 0006.json

## Live preview

- URL: https://mohamad-ilyas.github.io/agency-projects/xo-online/ — published 2026-11-01. The CEO asked for it to be published; the workflow was started for them and the CEO approved the github-pages deployment. Run 41356781424 built xo-online from commit 585b4d1; build and deploy succeeded.
- Not yet checked: the page loading in a browser (the build session cannot reach github.io) and live online play between two devices (review condition 2, EMP-011).
