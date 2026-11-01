# xo-online — Spec (EMP-002, draft for CEO confirmation)

**Context.** CEO request (PROJECT.md): two-player online XO via a shared link; names required; third visitor sees "locked"; main URL shows a lobby of joinable games; rematch with the same player and a running score; professional, fully animated UI.
**Key decisions (from PROJECT.md assumptions):** (D1) static site on GitHub Pages, no own server; (D2) realtime through a free public MQTT broker over WSS, game + lobby state in retained messages; (D3) share links are hash-based `#/game/<id>`; (D4) a same-browser local test mode (BroadcastChannel) for testing without the broker; (D5) only a display name is collected, kept in localStorage. Technology choices beyond these belong to the Technical Lead.
**NFRs (short):** N1 a move appears for the opponent within ~1 s under normal broker conditions (not guaranteed: public broker, no SLA). N2 no secrets/personal data in code; data on the broker is public. N3 WCAG 2.1 AA contrast, full keyboard use. N4 Arabic RTL + English. N5 usable from 360 px width; on slow/dropped connections the UI shows offline state and recovers on reconnect.

## User stories and acceptance criteria

**US-1 Name.** As a player I want to enter my name once so others know who I am.
AC-1.1 Given the name field is empty or whitespace only, When I submit, Then I am blocked with an inline error. AC-1.2 Given a name longer than 20 characters after trimming, When I submit, Then I am blocked with an error (1–20 chars, trimmed). AC-1.3 Given I saved a valid name, When I revisit the site in the same browser, Then it is prefilled and I can change it.

**US-2 Create and share.** As a host I want to create a game and send a link so a friend can join.
AC-2.1 Given I have a name, When I press "Create game", Then a game with a unique id is created, I am seated as X, and I see a waiting screen with the link `…/#/game/<id>`. AC-2.2 Given the waiting screen, When I press "Copy link", Then the link is copied and a confirmation is shown. AC-2.3 Given the browser supports Web Share, When I press "Share", Then the native share sheet opens; Given it does not, Then the Share button is hidden. AC-2.4 Given the game was created, When anyone opens the lobby, Then the game is listed (US-7).

**US-3 Join via link.** As an invited player I want to open the link and play immediately.
AC-3.1 Given seat O is free, When I open the link and have a name, Then I take seat O, both players see the board, and X moves first. AC-3.2 Given I have no saved name, When I open the link, Then I am asked for my name first and then joined. AC-3.3 Given I already hold a seat in this game (same browser), When I reopen the link, Then I return to my seat, not a new one. AC-3.4 Given the id does not exist or has expired, When I open the link, Then I see "Game not found" with a link to the lobby.

**US-4 Turns.** As a player I want fair turn-taking.
AC-4.1 Given it is my turn, When I pick an empty cell, Then my mark is placed, the turn passes, and the opponent sees it. AC-4.2 Given a cell is occupied, When I pick it, Then nothing changes. AC-4.3 Given it is not my turn, When I pick any cell, Then nothing changes and the board shows whose turn it is. AC-4.4 Given the round is over, When I pick any cell, Then nothing changes.

**US-5 Result.** As a player I want a clear result.
AC-5.1 Given a player completes a row, column, or diagonal, When the move lands, Then both screens show the winner by name and the winning line is highlighted. AC-5.2 Given all 9 cells are filled with no line, When the last move lands, Then both screens show "Draw". AC-5.3 Given a round ends, Then the score (US-8) updates once.

**US-6 Locked.** As a third visitor I want to know the game is full.
AC-6.1 Given both seats are taken, When I open the link, Then I see a "This game is locked" screen with a link to the lobby and no board controls. AC-6.2 Given I am on the locked screen, Then nothing I do changes the game for the two players.

**US-7 Lobby.** As a visitor I want to find a game to join.
AC-7.1 Given I open the main URL, Then I see games waiting for a second player with host name and created time. AC-7.2 Given a game is full or idle > 10 minutes, Then it is not listed. AC-7.3 Given a listed game, When I press "Join", Then I join it as in AC-3.1. AC-7.4 Given no games are waiting, Then I see an empty state with "Create game". AC-7.5 Given the lobby is open, When games are created, filled, or go stale, Then the list updates without a reload.

**US-8 Rematch and score.** As both players we want to keep playing and keep score.
AC-8.1 Given a round ended, When one player presses "Play again", Then they see "Waiting for <opponent>" and the new round starts only after both press it. AC-8.2 Given a new round starts, Then the starting player alternates each round (round 1: X starts). AC-8.3 Given rounds are played, Then the score shows wins per player name and draws, carried across rounds of this game. AC-8.4 Given a player reloads the page, When they return to their seat, Then the board and score are unchanged.

**US-9 Opponent leaves.** As a player I want to know if my opponent is gone.
AC-9.1 Given my opponent closes the tab or loses connection, When ~15 s pass without contact, Then their name shows "offline". AC-9.2 Given a seat holder is offline while the game is live, When a stranger opens the link, Then they still see the locked screen (AC-6.1). AC-9.3 Given the offline player returns in the same browser, Then they retake their seat and play continues.

**US-10 Connection.** As a player I want to know if I am connected.
AC-10.1 Given any game or lobby screen, Then an indicator shows connecting / online / offline. AC-10.2 Given I am offline, Then moves are disabled and the app reconnects automatically when the network returns. AC-10.3 Given the local test mode is enabled, When two tabs of the same browser open the same game, Then they can play a full round without the broker.

**US-11 Animation.** As a player I want a polished, animated UI.
AC-11.1 Given a mark is placed, a round is won, or the screen changes, Then the mark is drawn, the win line is drawn, and screens transition with animation. AC-11.2 Given the OS requests reduced motion, Then these animations are removed or reduced to fades and all functions still work.

**US-12 Language and accessibility.** As any player I want Arabic or English and full keyboard use.
AC-12.1 Given the language switch, When I choose Arabic, Then all text is Arabic and layout is RTL; the choice persists on reload. AC-12.2 Given a first visit, Then the language follows the browser, with English as fallback. AC-12.3 Given focus is on the board, When I use arrow keys and Enter, Then focus moves between cells and Enter places my mark. AC-12.4 Given a screen reader, Then each cell has a label (row, column, content) in the current language. AC-12.5 Given turn changes or a result, Then a live region announces it.

## Out of scope
Accounts/login; chat; spectating a locked game; AI/computer opponent; history or scores across games or devices; anti-cheat or security against a malicious client on the public broker (messages can be read or spoofed); more than 2 players; board sizes other than 3x3.

## Risks and dependencies
R1 Public broker can be down, slow, or rate-limited (no SLA). R2 Anyone can read/spoof game messages. R3 Build session cannot reach the broker; live play is verified only by the CEO on the preview. Dependency: CEO-approved preview publish.

## Assumptions for CEO confirmation (PROJECT.md open questions)
A1 (Q1) The free public broker is acceptable for this casual game. A2 (Q2) Idle games leave the lobby after 10 minutes. A3 (Q3) Starter alternates each round (this spec uses alternation, not "loser starts"). A4 (Q4) No spectators; third visitors see the locked screen. A5 (Q5) Default language follows the browser, English fallback. A6 (EMP-002 inference) Offline detection threshold ~15 s; seat reclaim works only from the same browser. All open questions: answerer = CEO.
