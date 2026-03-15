# Local Dev Environment (Cloud Code)

This project ships both a backend server and a Solid/Vite frontend. The easiest way to run both services together is from the repo root using the helper scripts defined in `package.json`.

## Run everything
- `bun run all` – launches the isolated backend server (`packages/opencode`) and the frontend (`packages/app`) in parallel. The backend listens on port `4096` and the frontend will proxy to it automatically. This mirrors what the Cloud Code web UI needs.

## Frontend-only workflow
- `bun run dev:web` – runs only the Vite frontend from `packages/app`. Use this when the backend is already running (locally or remotely).

## How to stop the dev servers
- `bun run kill` – stops both server processes that `bun run all` and the individual `dev:*` scripts start. It looks for the backend (`src/index.ts serve --port 4096`) and the Vite dev server, so you can safely run it before rerunning `bun run all`.

Keep this page up to date if the ports or scripts change, so everyone working on Cloud Code knows how to boot the local stack quickly.
