# xo-online app

Two-player online XO (tic-tac-toe). Vite + React + TypeScript static site; realtime via a free public MQTT broker.

- `npm run dev` · `npm test` · `npm run build:preview` (set `BASE_PATH=/agency-projects/xo-online/` for the preview).
- Broker: `wss://broker.hivemq.com:8884/mqtt` by default; override with `VITE_BROKER_URL`. Data on the public broker is
  readable/spoofable by anyone: casual use only, no personal data beyond a display name.
- Same-browser test mode (no broker): open `…/?transport=local#/` in two tabs.
- Code: `src/lib/game.ts` (rules), `src/lib/room.ts` (room model/reducers/lobby/conflicts), `src/lib/transport.ts`
  (MQTT / BroadcastChannel / in-memory), `src/lib/client.ts` (topics, presence, conflict merge).
