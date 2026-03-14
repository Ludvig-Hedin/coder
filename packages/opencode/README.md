# js

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.12. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Railway

The Railway image starts via `start.sh`. Set `CORS_ORIGIN` to one or more full origins and the script will append `--cors` flags for `opencode serve`.

Example:

```bash
CORS_ORIGIN=https://cloud-agent-dev.vercel.app
```

Multiple origins can be provided as a comma-separated list:

```bash
CORS_ORIGIN=https://cloud-agent-dev.vercel.app,https://your-prod-app.vercel.app
```
