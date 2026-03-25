import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { ResizeHandle } from "@opencode-ai/ui/resize-handle"
import { Spinner } from "@opencode-ai/ui/spinner"
import { createEffect, createMemo, createSignal, Match, on, onCleanup, Show, Switch } from "solid-js"
import { createMediaQuery } from "@solid-primitives/media"
import { useLayout } from "@/context/layout"
import { usePlatform } from "@/context/platform"
import { useSDK } from "@/context/sdk"

type PreviewStatus = "idle" | "starting" | "ready" | "stopped"

export function PreviewPanel() {
  const layout = useLayout()
  const sdk = useSDK()
  const platform = usePlatform()

  const [status, setStatus] = createSignal<PreviewStatus>("idle")
  const [url, setUrl] = createSignal<string | null>(null)
  const [ptyId, setPtyId] = createSignal<string | null>(null)
  let iframeRef: HTMLIFrameElement | undefined

  const isDesktop = createMediaQuery("(min-width: 768px)")
  const open = createMemo(() => isDesktop() && layout.preview.opened())
  const panelWidth = createMemo(() => (open() ? `${layout.preview.width()}px` : "0px"))

  // ── Event subscriptions ────────────────────────────────────────────────────
  // Using sdk.event.on (per-instance typed emitter) — same pattern as terminal.tsx.
  // This requires the fetch calls below to pass the directory so the backend
  // instance context matches and Bus.publish emits with the correct directory.
  createEffect(() => {
    // @ts-expect-error - preview events are not mapped in this sdk version
    const unsubReady = sdk.event.on("preview.ready", (event: any) => {
      setUrl(event.properties.url)
      setPtyId(event.properties.ptyId)
      setStatus("ready")
    })

    // @ts-expect-error - preview events are not mapped in this sdk version
    const unsubStopped = sdk.event.on("preview.stopped", () => {
      setStatus("idle")
      setUrl(null)
      setPtyId(null)
    })

    onCleanup(() => {
      unsubReady()
      unsubStopped()
    })
  })

  // Auto-start when panel opens for the first time (idle state)
  createEffect(
    on(open, async (isOpen) => {
      if (!isOpen) return
      if (status() !== "idle") return
      await startServer()
    }),
  )

  // ── Helpers ────────────────────────────────────────────────────────────────
  // The server middleware reads the project directory from ?directory= query param
  // or the x-opencode-directory header. We must pass both so the backend creates
  // the PTY in the correct instance context and Bus.publish emits with the right
  // directory key (which must match sdk.directory for events to be received).
  function previewHeaders(dir: string): HeadersInit {
    return {
      "Content-Type": "application/json",
      "x-opencode-directory": dir,
    }
  }

  function previewUrl(path: string, dir: string, extra?: Record<string, string>) {
    const params = new URLSearchParams({ directory: dir, ...extra })
    return `${sdk.url}${path}?${params}`
  }

  const startServer = async () => {
    const dir = sdk.directory
    if (!dir) return

    try {
      setStatus("starting")

      // Detect the appropriate dev-server command for this project.
      // Pass directory as both query param (middleware reads it) and in URL.
      const detectRes = await fetch(previewUrl("/preview/detect", dir))
      if (!detectRes.ok) throw new Error(`Detect failed: ${detectRes.status}`)
      const detected = (await detectRes.json()) as { command: string; args: string[] }

      // Start the dev server. The backend polls PTY output for a localhost URL
      // and emits preview.ready when found — we pick it up via sdk.event.on above.
      const startRes = await fetch(previewUrl("/preview/start", dir), {
        method: "POST",
        headers: previewHeaders(dir),
        body: JSON.stringify({ command: detected.command, args: detected.args }),
      })
      if (!startRes.ok) throw new Error(`Start failed: ${startRes.status}`)
    } catch {
      setStatus("idle")
    }
  }

  const stopServer = async () => {
    const dir = sdk.directory
    try {
      await fetch(previewUrl("/preview/stop", dir ?? ""), {
        method: "POST",
        headers: dir ? previewHeaders(dir) : {},
      })
    } catch {
      // best-effort — preview.stopped event will update state
    }
    setStatus("idle")
    setUrl(null)
    setPtyId(null)
  }

  const refresh = () => {
    // Re-assign src to force the iframe to reload without remounting
    if (iframeRef) iframeRef.src = iframeRef.src
  }

  const openInBrowser = () => {
    const u = url()
    if (!u) return
    platform.openLink(u)
  }

  return (
    <Show when={isDesktop()}>
      <aside
        id="preview-panel"
        aria-label="App preview"
        aria-hidden={!open()}
        // @ts-expect-error – inert is a valid HTML attribute
        inert={!open() ? "" : undefined}
        class="relative min-w-0 h-full flex shrink-0 overflow-hidden bg-background-base"
        classList={{ "pointer-events-none": !open() }}
        style={{ width: panelWidth() }}
      >
        <div class="size-full flex flex-col border-l border-border-weaker-base">
          {/* Toolbar */}
          <div class="flex items-center gap-1 px-2 h-9 shrink-0 border-b border-border-weaker-base">
            <div class="flex-1 min-w-0 text-11-regular text-text-weak truncate px-1">
              <Switch>
                <Match when={status() === "idle"}>No server running</Match>
                <Match when={status() === "starting"}>
                  <span class="flex items-center gap-1.5">
                    <Spinner class="size-3 opacity-50" />
                    Starting server…
                  </span>
                </Match>
                <Match when={status() === "ready"}>{url()}</Match>
                <Match when={status() === "stopped"}>Server stopped</Match>
              </Switch>
            </div>

            <Show when={status() === "ready"}>
              <Button
                variant="ghost"
                class="titlebar-icon w-7 h-7 p-0 shrink-0"
                onClick={refresh}
                aria-label="Refresh preview"
              >
                <Icon name="reset" size="small" />
              </Button>
              <Button
                variant="ghost"
                class="titlebar-icon w-7 h-7 p-0 shrink-0"
                onClick={openInBrowser}
                aria-label="Open in browser"
              >
                <Icon name="square-arrow-top-right" size="small" />
              </Button>
            </Show>

            <Show when={status() === "starting" || status() === "ready"}>
              <Button
                variant="ghost"
                class="titlebar-icon w-7 h-7 p-0 shrink-0"
                onClick={stopServer}
                aria-label="Stop preview server"
              >
                <Icon name="stop" size="small" class="text-icon-base" />
              </Button>
            </Show>

            <Show when={status() === "idle" || status() === "stopped"}>
              <Button
                variant="ghost"
                class="titlebar-icon w-7 h-7 p-0 shrink-0"
                onClick={startServer}
                aria-label="Start preview server"
              >
                <Icon name="arrow-right" size="small" />
              </Button>
            </Show>
          </div>

          {/* Preview content area */}
          <div class="flex-1 min-h-0 relative bg-white">
            <Switch>
              <Match when={status() === "idle"}>
                <div class="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
                  <Icon name="server" size="large" class="opacity-20 text-icon-base" />
                  <div class="text-12-regular text-text-weak">Press play to start the dev server</div>
                </div>
              </Match>

              <Match when={status() === "starting"}>
                <div class="h-full flex flex-col items-center justify-center gap-3">
                  <Spinner class="size-5 opacity-40" />
                  <div class="text-12-regular text-text-weak">Waiting for server…</div>
                </div>
              </Match>

              <Match when={status() === "ready" && !!url()}>
                <iframe
                  ref={iframeRef}
                  src={url()!}
                  class="size-full border-none"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  title="App preview"
                />
              </Match>

              <Match when={status() === "stopped"}>
                <div class="h-full flex flex-col items-center justify-center gap-3">
                  <div class="text-12-regular text-text-weak">Server stopped</div>
                  <Button variant="ghost" size="small" onClick={startServer}>
                    Restart
                  </Button>
                </div>
              </Match>
            </Switch>
          </div>
        </div>

        {/* Resize handle on the left edge, matches session-side-panel pattern */}
        <Show when={open()}>
          <ResizeHandle
            direction="horizontal"
            edge="start"
            size={layout.preview.width()}
            min={300}
            max={800}
            collapseThreshold={220}
            onResize={(width) => layout.preview.resize(width)}
            onCollapse={layout.preview.close}
          />
        </Show>
      </aside>
    </Show>
  )
}
