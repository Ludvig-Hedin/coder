
To spin up the local dev stack:

Install project dependencies if you haven’t already:
bun install (from the repo root).

For the web UI (Solid/Vite) run the dev:web script defined in /Users/ludvighedin/Programming/personal/AB/coder/package.json:
bun run dev:web – it starts the frontend at <http://localhost:5173> (Vite’s default) with hot reload, so you can see your CSS tweaks instantly.

If you also want the Opencode backend running (the packages/opencode Hono server), run the dev script from the same root:
bun run dev – it boots the API and keep it watching your server-side changes.

PORT=3001 bun run dev:web
