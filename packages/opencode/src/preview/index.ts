import z from "zod"
import path from "path"
import { Log } from "../util/log"
import { Instance } from "../project/instance"
import { Pty } from "../pty"
import { Bus } from "@/bus"
import { BusEvent } from "@/bus/bus-event"
import type { PtyID } from "../pty/schema"

export namespace Preview {
  const log = Log.create({ service: "preview" })

  // ──────────────────────────────────────────────────────────
  // Bus events
  // ──────────────────────────────────────────────────────────

  export const Event = {
    /** Emitted when a localhost URL is detected in the dev-server output. */
    Ready: BusEvent.define(
      "preview.ready",
      z.object({
        url: z.string(),
        ptyId: z.string(),
      }),
    ),
    /** Emitted when the preview server has been stopped. */
    Stopped: BusEvent.define("preview.stopped", z.object({ ptyId: z.string() })),
  }

  // ──────────────────────────────────────────────────────────
  // Zod schemas
  // ──────────────────────────────────────────────────────────

  export const DetectResult = z
    .object({
      command: z.string(),
      args: z.array(z.string()),
      framework: z.string().optional(),
      defaultPort: z.number().optional(),
    })
    .meta({ ref: "PreviewDetectResult" })

  export type DetectResult = z.infer<typeof DetectResult>

  // ──────────────────────────────────────────────────────────
  // Per-instance state: tracks the currently active preview PTY
  // ──────────────────────────────────────────────────────────

  interface PreviewState {
    ptyId: string | undefined
    pollTimer: ReturnType<typeof setInterval> | undefined
    unsubExit: (() => void) | undefined
  }

  // The `init` function is used as a Map key by State.create, so it MUST be a
  // stable reference (module-level function, not an inline arrow).
  function initPreviewState(): PreviewState {
    return { ptyId: undefined, pollTimer: undefined, unsubExit: undefined }
  }

  const stateRef = Instance.state(initPreviewState, async (s) => {
    _cleanup(s)
  })

  function _cleanup(s: PreviewState) {
    if (s.pollTimer !== undefined) {
      clearInterval(s.pollTimer)
      s.pollTimer = undefined
    }
    if (s.unsubExit) {
      s.unsubExit()
      s.unsubExit = undefined
    }
    if (s.ptyId) {
      void Pty.remove(s.ptyId as PtyID).catch(() => {})
      s.ptyId = undefined
    }
  }

  // ──────────────────────────────────────────────────────────
  // URL detection helpers
  // ──────────────────────────────────────────────────────────

  // ANSI escape code stripper – needed because terminal output contains colour
  // codes that break URL regex matching.
  // Covers CSI sequences (\x1B[...X), OSC sequences (\x1B]...\x07), and single
  // character escapes (\x1B[A-Z\\]) – matches modern tools like Vite/Next.js.
  const ANSI_RE = /\x1B(?:[@-Z\\-_]|\[[0-9;]*[A-Za-z]|\][^\x07]*\x07)/g

  const URL_PATTERNS = [
    // Vite: "Local:   http://localhost:5173/"
    /Local:\s+https?:\/\/(localhost:\d+)/i,
    // Next.js: "ready on http://localhost:3000"
    /ready[^\n]*https?:\/\/(localhost:\d+)/i,
    // Generic "http://localhost:PORT" or "http://127.0.0.1:PORT"
    /https?:\/\/(127\.0\.0\.1:\d+|localhost:\d+)/i,
    // "listening on :PORT" or "listening on 0.0.0.0:PORT"
    /listening[^\n]*:(\d{4,5})/i,
    // "Server running at PORT" / "started on port PORT"
    /(?:running|started)[^\n]*port[^\d]*(\d{4,5})/i,
  ]

  function extractUrl(raw: string): string | undefined {
    const text = raw.replace(ANSI_RE, "")
    for (const re of URL_PATTERNS) {
      const m = text.match(re)
      if (m) {
        const capture = m[1]
        if (!capture) continue
        // If the capture is just "host:port" (no scheme), add http://
        if (capture.startsWith("localhost:") || capture.startsWith("127.0.0.1:")) {
          return `http://${capture}`
        }
        // Capture is a full port number from "listening on :PORT" patterns
        if (/^\d+$/.test(capture)) {
          return `http://localhost:${capture}`
        }
        return capture
      }
    }
    return undefined
  }

  // ──────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────

  /**
   * Inspect the project directory to determine the most likely dev-server
   * command. Supports Node (npm/yarn/pnpm/bun), Rust, Go, Python.
   */
  export async function detect(dir: string): Promise<DetectResult> {
    // ── Node.js projects ──
    try {
      const pkgRaw = await Bun.file(path.join(dir, "package.json")).text()
      const pkg = JSON.parse(pkgRaw)
      const scripts: Record<string, string> = pkg.scripts ?? {}
      const deps: Record<string, string> = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
      }

      // Detect framework
      const isNext = !!deps["next"]
      const isVite = !!deps["vite"]
      const isAstro = !!deps["astro"]
      const isSvelte = !!deps["@sveltejs/kit"]
      const isNuxt = !!deps["nuxt"]
      const isCRA = !!deps["react-scripts"]
      const isRemix = !!deps["@remix-run/node"] || !!deps["@remix-run/react"]

      const framework = isNext
        ? "Next.js"
        : isVite
          ? "Vite"
          : isAstro
            ? "Astro"
            : isSvelte
              ? "SvelteKit"
              : isNuxt
                ? "Nuxt"
                : isCRA
                  ? "Create React App"
                  : isRemix
                    ? "Remix"
                    : undefined

      const defaultPort = isNext || isNuxt || isCRA || isRemix ? 3000 : isAstro ? 4321 : 5173

      const scriptKey = "dev" in scripts ? "dev" : "start" in scripts ? "start" : "serve" in scripts ? "serve" : null
      if (scriptKey) {
        // Detect package manager from lock files
        const hasBunLock = await Bun.file(path.join(dir, "bun.lock")).exists()
        const hasYarnLock = await Bun.file(path.join(dir, "yarn.lock")).exists()
        const hasPnpmLock = await Bun.file(path.join(dir, "pnpm-lock.yaml")).exists()

        const pm = hasBunLock ? "bun" : hasPnpmLock ? "pnpm" : hasYarnLock ? "yarn" : "npm"
        return { command: pm, args: ["run", scriptKey], framework, defaultPort }
      }
    } catch {
      // package.json not found or malformed – fall through
    }

    // ── Rust / Cargo ──
    if (await Bun.file(path.join(dir, "Cargo.toml")).exists()) {
      return { command: "cargo", args: ["run"], framework: "Rust", defaultPort: 8080 }
    }

    // ── Go ──
    if (await Bun.file(path.join(dir, "go.mod")).exists()) {
      return { command: "go", args: ["run", "."], framework: "Go", defaultPort: 8080 }
    }

    // ── Python (pyproject.toml / requirements.txt) ──
    if (await Bun.file(path.join(dir, "pyproject.toml")).exists()) {
      return { command: "python", args: ["-m", "uvicorn", "main:app", "--reload"], framework: "Python", defaultPort: 8000 }
    }
    if (await Bun.file(path.join(dir, "requirements.txt")).exists()) {
      return { command: "python", args: ["app.py"], framework: "Python", defaultPort: 5000 }
    }

    // ── Fallback ──
    return { command: "npm", args: ["run", "dev"], defaultPort: 3000 }
  }

  /** Returns the current preview state (ptyId + running flag). */
  export function status() {
    const s = stateRef()
    return {
      ptyId: s.ptyId,
      running: s.ptyId !== undefined,
    }
  }

  /**
   * Start a dev server.
   * - Stops any already-running preview server for this project.
   * - Creates a PTY with the given command.
   * - Polls PTY output every 500 ms (up to 90 s) looking for a localhost URL.
   * - Emits `preview.ready` when a URL is found, or stops polling after timeout.
   */
  export async function start(input: { cwd: string; command: string; args: string[] }) {
    const s = stateRef()

    // Stop existing server if one is already running
    if (s.ptyId) {
      _cleanup(s)
    }

    log.info("starting preview server", { command: input.command, args: input.args, cwd: input.cwd })

    const info = await Pty.create({
      command: input.command,
      args: input.args,
      cwd: input.cwd,
      title: "Preview",
    })

    s.ptyId = info.id

    // Subscribe to PTY exit so we can clean up automatically
    s.unsubExit = Bus.subscribe(Pty.Event.Exited, ({ properties }) => {
      if (properties.id !== s.ptyId) return
      log.info("preview PTY exited", { ptyId: s.ptyId })
      const stoppedId = s.ptyId!
      s.ptyId = undefined
      if (s.pollTimer !== undefined) {
        clearInterval(s.pollTimer)
        s.pollTimer = undefined
      }
      if (s.unsubExit) {
        s.unsubExit()
        s.unsubExit = undefined
      }
      void Bus.publish(Preview.Event.Stopped, { ptyId: stoppedId })
    })

    // Poll PTY output for a URL (up to 90 s = 180 ticks × 500 ms)
    let ticks = 0
    const MAX_TICKS = 180
    const ptyId = info.id as PtyID

    s.pollTimer = setInterval(() => {
      ticks++

      const raw = Pty.buffer(ptyId)
      const url = extractUrl(raw)

      if (url) {
        log.info("preview URL detected", { url, ptyId })
        clearInterval(s.pollTimer!)
        s.pollTimer = undefined
        void Bus.publish(Preview.Event.Ready, { url, ptyId: info.id })
        return
      }

      if (ticks >= MAX_TICKS) {
        log.warn("preview URL detection timed out", { ptyId })
        clearInterval(s.pollTimer!)
        s.pollTimer = undefined
      }
    }, 500)

    return info
  }

  /**
   * Stop the running preview server.
   * Returns `true` if a server was running and was stopped.
   */
  export async function stop() {
    const s = stateRef()
    if (!s.ptyId) return false
    log.info("stopping preview server", { ptyId: s.ptyId })
    const stoppedId = s.ptyId
    _cleanup(s)
    void Bus.publish(Preview.Event.Stopped, { ptyId: stoppedId })
    return true
  }
}
