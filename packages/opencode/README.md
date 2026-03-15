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

The Railway image starts via `start.sh`. The container intentionally uses the non-Alpine Bun base image because `bun-pty` requires glibc on Linux for terminal sessions to work.

Set `CORS_ORIGIN` to one or more full origins and the script will append `--cors` flags for `opencode serve`.

Example:

```bash
CORS_ORIGIN=https://cloud-agent-dev.vercel.app
```

Multiple origins can be provided as a comma-separated list:

```bash
CORS_ORIGIN=https://cloud-agent-dev.vercel.app,https://your-prod-app.vercel.app
```

Wildcard suffixes are also supported for HTTPS preview subdomains:

```bash
CORS_ORIGIN=https://cloud-agent-dev.vercel.app,*ludvighedin15-gmailcoms-projects.vercel.app
```
