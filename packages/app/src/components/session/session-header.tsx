import { AppIcon } from "@opencode-ai/ui/app-icon"
import { Button } from "@opencode-ai/ui/button"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Keybind } from "@opencode-ai/ui/keybind"
import { Spinner } from "@opencode-ai/ui/spinner"
import { showToast } from "@opencode-ai/ui/toast"
import { Tooltip, TooltipKeybind } from "@opencode-ai/ui/tooltip"
import { getFilename } from "@opencode-ai/util/path"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { Portal } from "solid-js/web"
import { useCommand } from "@/context/command"
import { useLanguage } from "@/context/language"
import { useLayout } from "@/context/layout"
import { usePlatform } from "@/context/platform"
import { useServer } from "@/context/server"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import { useTerminal } from "@/context/terminal"
import { focusTerminalById } from "@/pages/session/helpers"
import { useSessionLayout } from "@/pages/session/session-layout"
import { decode64 } from "@/utils/base64"
import { Persist, persisted } from "@/utils/persist"
import { StatusPopover } from "../status-popover"

const OPEN_APPS = [
  "vscode",
  "cursor",
  "zed",
  "textmate",
  "antigravity",
  "finder",
  "terminal",
  "iterm2",
  "ghostty",
  "warp",
  "xcode",
  "android-studio",
  "powershell",
  "sublime-text",
] as const

type OpenApp = (typeof OPEN_APPS)[number]
type OS = "macos" | "windows" | "linux" | "unknown"

const MAC_APPS = [
  {
    id: "vscode",
    label: "session.header.open.app.vscode",
    icon: "vscode",
    openWith: "Visual Studio Code",
  },
  { id: "cursor", label: "session.header.open.app.cursor", icon: "cursor", openWith: "Cursor" },
  { id: "zed", label: "session.header.open.app.zed", icon: "zed", openWith: "Zed" },
  { id: "textmate", label: "session.header.open.app.textmate", icon: "textmate", openWith: "TextMate" },
  {
    id: "antigravity",
    label: "session.header.open.app.antigravity",
    icon: "antigravity",
    openWith: "Antigravity",
  },
  { id: "terminal", label: "session.header.open.app.terminal", icon: "terminal", openWith: "Terminal" },
  { id: "iterm2", label: "session.header.open.app.iterm2", icon: "iterm2", openWith: "iTerm" },
  { id: "ghostty", label: "session.header.open.app.ghostty", icon: "ghostty", openWith: "Ghostty" },
  { id: "warp", label: "session.header.open.app.warp", icon: "warp", openWith: "Warp" },
  { id: "xcode", label: "session.header.open.app.xcode", icon: "xcode", openWith: "Xcode" },
  {
    id: "android-studio",
    label: "session.header.open.app.androidStudio",
    icon: "android-studio",
    openWith: "Android Studio",
  },
  {
    id: "sublime-text",
    label: "session.header.open.app.sublimeText",
    icon: "sublime-text",
    openWith: "Sublime Text",
  },
] as const

const WINDOWS_APPS = [
  { id: "vscode", label: "session.header.open.app.vscode", icon: "vscode", openWith: "code" },
  { id: "cursor", label: "session.header.open.app.cursor", icon: "cursor", openWith: "cursor" },
  { id: "zed", label: "session.header.open.app.zed", icon: "zed", openWith: "zed" },
  {
    id: "powershell",
    label: "session.header.open.app.powershell",
    icon: "powershell",
    openWith: "powershell",
  },
  {
    id: "sublime-text",
    label: "session.header.open.app.sublimeText",
    icon: "sublime-text",
    openWith: "Sublime Text",
  },
] as const

const LINUX_APPS = [
  { id: "vscode", label: "session.header.open.app.vscode", icon: "vscode", openWith: "code" },
  { id: "cursor", label: "session.header.open.app.cursor", icon: "cursor", openWith: "cursor" },
  { id: "zed", label: "session.header.open.app.zed", icon: "zed", openWith: "zed" },
  {
    id: "sublime-text",
    label: "session.header.open.app.sublimeText",
    icon: "sublime-text",
    openWith: "Sublime Text",
  },
] as const

const detectOS = (platform: ReturnType<typeof usePlatform>): OS => {
  if (platform.platform === "desktop" && platform.os) return platform.os
  if (typeof navigator !== "object") return "unknown"
  const value = navigator.platform || navigator.userAgent
  if (/Mac/i.test(value)) return "macos"
  if (/Win/i.test(value)) return "windows"
  if (/Linux/i.test(value)) return "linux"
  return "unknown"
}

const showRequestError = (language: ReturnType<typeof useLanguage>, err: unknown) => {
  showToast({
    variant: "error",
    title: language.t("common.requestFailed"),
    description: err instanceof Error ? err.message : String(err),
  })
}

export function SessionHeader() {
  const layout = useLayout()
  const command = useCommand()
  const server = useServer()
  const platform = usePlatform()
  const language = useLanguage()
  const sync = useSync()
  const terminal = useTerminal()
  const sdk = useSDK()
  const { params, view } = useSessionLayout()

  const projectDirectory = createMemo(() => decode64(params.dir) ?? "")
  const project = createMemo(() => {
    const directory = projectDirectory()
    if (!directory) return
    return layout.projects.list().find((p) => p.worktree === directory || p.sandboxes?.includes(directory))
  })
  const name = createMemo(() => {
    const current = project()
    if (current) return current.name || getFilename(current.worktree)
    return getFilename(projectDirectory())
  })
  const hotkey = createMemo(() => command.keybind("file.open"))
  const os = createMemo(() => detectOS(platform))
  const [gitConnecting, setGitConnecting] = createSignal(false)
  const [gitJustConnected, setGitJustConnected] = createSignal(false)
  const gitInfo = createMemo(() => sync.data.vcs)
  const diffsForSession = createMemo(() => {
    const id = params.id
    if (!id) return []
    return sync.data.session_diff[id] ?? []
  })
  const gitAvailable = createMemo(() => project()?.vcs === "git" || gitJustConnected())
  const remoteConfigured = () => !!gitInfo()?.remote
  const ghAvailable = () => !!gitInfo()?.gh

  const [exists, setExists] = createStore<Partial<Record<OpenApp, boolean>>>({
    finder: true,
  })

  const apps = createMemo(() => {
    if (os() === "macos") return MAC_APPS
    if (os() === "windows") return WINDOWS_APPS
    return LINUX_APPS
  })

  const fileManager = createMemo(() => {
    if (os() === "macos") return { label: "session.header.open.finder", icon: "finder" as const }
    if (os() === "windows") return { label: "session.header.open.fileExplorer", icon: "file-explorer" as const }
    return { label: "session.header.open.fileManager", icon: "finder" as const }
  })
  const fileLabel = createMemo(() => language.t(fileManager().label))

  createEffect(() => {
    if (platform.platform !== "desktop") return
    if (!platform.checkAppExists) return

    const list = apps()

    setExists(Object.fromEntries(list.map((app) => [app.id, undefined])) as Partial<Record<OpenApp, boolean>>)

    void Promise.all(
      list.map((app) =>
        Promise.resolve(platform.checkAppExists?.(app.openWith))
          .then((value) => Boolean(value))
          .catch(() => false)
          .then((ok) => [app.id, ok] as const),
      ),
    ).then((entries) => {
      setExists(Object.fromEntries(entries) as Partial<Record<OpenApp, boolean>>)
    })
  })

  const options = createMemo(() => {
    return [
      { id: "finder", label: language.t(fileManager().label), icon: fileManager().icon },
      ...apps()
        .filter((app) => exists[app.id])
        .map((app) => ({ ...app, label: language.t(app.label) })),
    ] as const
  })

  const toggleTerminal = () => {
    const next = !view().terminal.opened()
    view().terminal.toggle()
    if (!next) return

    const id = terminal.active()
    if (!id) return
    focusTerminalById(id)
  }

  const [prefs, setPrefs] = persisted(Persist.global("open.app"), createStore({ app: "finder" as OpenApp }))
  const [openRequest, setOpenRequest] = createStore({
    app: undefined as OpenApp | undefined,
  })

  const canOpen = createMemo(() => platform.platform === "desktop" && !!platform.openPath && server.isLocal())
  const editors = createMemo(() => options().filter((item) => item.id !== "finder"))
  const hasEditors = createMemo(() => editors().length > 0)
  const current = createMemo(
    () =>
      editors().find((o) => o.id === prefs.app) ??
      editors()[0] ??
      ({ id: "finder", label: fileManager().label, icon: fileManager().icon } as const),
  )
  const opening = createMemo(() => openRequest.app !== undefined)

  const selectApp = (app: OpenApp) => {
    if (!editors().some((item) => item.id === app)) return
    setPrefs("app", app)
  }

  const openDir = (app: OpenApp) => {
    if (opening() || !canOpen() || !platform.openPath) return
    const directory = projectDirectory()
    if (!directory) return

    const item = options().find((o) => o.id === app)
    const openWith = item && "openWith" in item ? item.openWith : undefined
    setOpenRequest("app", app)
    platform
      .openPath(directory, openWith)
      .catch((err: unknown) => showRequestError(language, err))
      .finally(() => {
        setOpenRequest("app", undefined)
      })
  }

  const copyPath = () => {
    const directory = projectDirectory()
    if (!directory) return
    navigator.clipboard
      .writeText(directory)
      .then(() => {
        showToast({
          variant: "success",
          icon: "circle-check",
          title: language.t("session.share.copy.copied"),
          description: directory,
        })
      })
      .catch((err: unknown) => showRequestError(language, err))
  }

  createEffect(() => {
    if (project()?.vcs === "git") {
      setGitJustConnected(false)
    }
  })

  const initGit = async () => {
    if (gitConnecting()) return
    setGitConnecting(true)
    try {
      const result = await sdk.client.project.initGit()
      if (result.data) {
        setGitJustConnected(true)
      }
    } catch (err) {
      showRequestError(language, err)
    } finally {
      setGitConnecting(false)
    }
  }

  const openReviewPanel = () => {
    view().reviewPanel.open()
  }

  const openTerminalPanel = () => {
    view().terminal.open()
  }

  const openEditor = () => {
    if (hasEditors()) {
      openDir(current().id)
      return
    }
    openDir("finder")
  }

  const centerMount = createMemo(() => document.getElementById("opencode-titlebar-center"))
  const rightMount = createMemo(() => document.getElementById("opencode-titlebar-right"))

  return (
    <>
      <Show when={centerMount()}>
        {(mount) => (
          <Portal mount={mount()}>
            <Button
              type="button"
              variant="ghost"
              size="small"
              class="hidden md:flex w-[240px] max-w-full min-w-0 pl-2 pr-3 py-1 min-h-8 items-center gap-2 justify-between rounded-md border border-border-weak-base bg-surface-panel shadow-none cursor-default"
              onClick={() => command.trigger("file.open")}
              aria-label={language.t("session.header.searchFiles")}
            >
              <div class="flex min-w-0 flex-1 items-center gap-1.5 overflow-visible">
                <Icon name="magnifying-glass" size="small" class="icon-base shrink-0 size-4" />
                <span class="flex-1 min-w-0 text-12-regular text-text-weak truncate text-left">
                  {language.t("session.header.search.placeholder", {
                    project: name(),
                  })}
                </span>
              </div>

              <Show when={hotkey()}>
                {(keybind) => (
                  <Keybind class="shrink-0 !border-0 !bg-transparent !shadow-none px-0 text-text-weaker">
                    {keybind()}
                  </Keybind>
                )}
              </Show>
            </Button>
          </Portal>
        )}
      </Show>
      <Show when={rightMount()}>
        {(mount) => (
          <Portal mount={mount()}>
            <div class="flex items-center gap-2">
              <Show when={projectDirectory()}>
                <div class="flex items-center">
                  <Show
                    when={gitAvailable()}
                    fallback={
                      <Button
                        variant="ghost"
                        size="small"
                        class="rounded-full h-8 gap-2 px-3"
                        onClick={initGit}
                        disabled={gitConnecting()}
                      >
                        <Show
                          when={gitConnecting()}
                          fallback={<Icon name="branch" size="small" class="text-icon-base" />}
                        >
                          <Spinner class="size-3" />
                        </Show>
                        <span class="text-12-medium text-text-strong">
                          {language.t("session.header.git.connect")}
                        </span>
                      </Button>
                    }
                  >
                    <DropdownMenu gutter={4} placement="bottom-end">
                      <DropdownMenu.Trigger
                        as={Button}
                        variant="ghost"
                        size="small"
                        class="rounded-full h-8 gap-2 px-3"
                      >
                        <Icon name="branch" size="small" class="text-icon-base" />
                        <span class="text-12-medium text-text-strong">
                          {language.t("session.header.git.trigger")}
                        </span>
                        <Icon name="chevron-down" size="small" class="text-icon-weak" />
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content class="mt-1 w-56 rounded-[18px] border border-border-weak-base bg-surface-panel p-2">
                          <div class="px-2 pb-1 text-10-medium uppercase text-text-weak">
                            {language.t("session.header.git.heading")}
                          </div>
                          <DropdownMenu.Item
                            onSelect={openReviewPanel}
                            disabled={diffsForSession().length === 0}
                          >
                            <div class="flex items-center gap-2 px-2 py-1">
                              <Icon name="branch" size="small" />
                              <DropdownMenu.ItemLabel>
                                {language.t("session.header.git.commit")}
                              </DropdownMenu.ItemLabel>
                            </div>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onSelect={openTerminalPanel} disabled={!remoteConfigured()}>
                            <div class="flex items-center gap-2 px-2 py-1">
                              <Icon name="arrow-up" size="small" />
                              <DropdownMenu.ItemLabel>
                                {language.t("session.header.git.push")}
                              </DropdownMenu.ItemLabel>
                            </div>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onSelect={openTerminalPanel} disabled={!ghAvailable()}>
                            <div class="flex items-center gap-2 px-2 py-1">
                              <Icon name="github" size="small" />
                              <DropdownMenu.ItemLabel>
                                {language.t("session.header.git.createPr")}
                              </DropdownMenu.ItemLabel>
                            </div>
                            <DropdownMenu.ItemDescription class="text-10-regular text-text-weak">
                              {language.t("session.header.git.createPrHint")}
                            </DropdownMenu.ItemDescription>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu>
                  </Show>
                </div>
              </Show>
              <div class="flex items-center gap-1">
                <Show when={projectDirectory() && canOpen()}>
                  <div class="hidden md:flex items-center gap-1 shrink-0">
                    <Tooltip
                      placement="bottom"
                      value={
                        hasEditors()
                          ? language.t("session.header.open.ariaLabel", { app: current().label })
                          : language.t("session.header.open.action", { app: fileLabel() })
                      }
                    >
                      <Button
                        variant="ghost"
                        size="small"
                        class="rounded-full h-8 gap-2 px-3"
                        onClick={openEditor}
                        disabled={opening()}
                        aria-label={
                          hasEditors()
                            ? language.t("session.header.open.ariaLabel", { app: current().label })
                            : language.t("session.header.open.action", { app: fileLabel() })
                        }
                      >
                        <Show
                          when={opening()}
                          fallback={
                            <>
                              <AppIcon id={hasEditors() ? current().icon : fileManager().icon} class="size-4" />
                              <span class="text-12-medium text-text-strong">
                                {language.t("session.header.openIn")} {hasEditors() ? current().label : fileLabel()}
                              </span>
                            </>
                          }
                        >
                          <Spinner class="size-3" />
                        </Show>
                      </Button>
                    </Tooltip>
                    <Show when={hasEditors()}>
                      <DropdownMenu gutter={4} placement="bottom-end">
                        <DropdownMenu.Trigger
                          as={Button}
                          variant="ghost"
                          size="small"
                          class="rounded-full h-8 w-8 p-0"
                          aria-label={language.t("session.header.open.menu")}
                        >
                          <Icon name="chevron-down" size="small" class="text-icon-weak" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content class="mt-1 w-64 rounded-[18px] border border-border-weak-base bg-surface-panel p-2">
                            <div class="px-2 pb-1 text-10-medium uppercase text-text-weak">
                              {language.t("session.header.openIn")}
                            </div>
                            <For each={editors()}>
                              {(item) => (
                                <DropdownMenu.Item
                                  onSelect={() => {
                                    selectApp(item.id)
                                    openDir(item.id)
                                  }}
                                >
                                  <div class="flex items-center gap-2 px-2 py-1">
                                    <AppIcon id={item.icon} class="size-4" />
                                    <DropdownMenu.ItemLabel>{item.label}</DropdownMenu.ItemLabel>
                                  </div>
                                </DropdownMenu.Item>
                              )}
                            </For>
                            <DropdownMenu.Separator class="my-1 h-px bg-border-weak-base" />
                            <DropdownMenu.Item onSelect={copyPath}>
                              <div class="flex items-center gap-2 px-2 py-1">
                                <Icon name="copy" size="small" />
                                <DropdownMenu.ItemLabel>{language.t("session.header.open.copyPath")}</DropdownMenu.ItemLabel>
                              </div>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu>
                    </Show>
                  </div>
                </Show>
                <Tooltip placement="bottom" value={language.t("status.popover.trigger")}>
                  <StatusPopover />
                </Tooltip>
                <TooltipKeybind
                  title={language.t("command.terminal.toggle")}
                  keybind={command.keybind("terminal.toggle")}
                >
                  <Button
                    variant="ghost"
                    class="group/terminal-toggle titlebar-icon w-8 h-6 p-0 box-border shrink-0"
                    onClick={toggleTerminal}
                    aria-label={language.t("command.terminal.toggle")}
                    aria-expanded={view().terminal.opened()}
                    aria-controls="terminal-panel"
                  >
                    <Icon size="small" name={view().terminal.opened() ? "terminal-active" : "terminal"} />
                  </Button>
                </TooltipKeybind>

                <div class="hidden md:flex items-center gap-1 shrink-0">
                  <TooltipKeybind
                    title={language.t("command.review.toggle")}
                    keybind={command.keybind("review.toggle")}
                  >
                    <Button
                      variant="ghost"
                      class="group/review-toggle titlebar-icon w-8 h-6 p-0 box-border"
                      onClick={() => view().reviewPanel.toggle()}
                      aria-label={language.t("command.review.toggle")}
                      aria-expanded={view().reviewPanel.opened()}
                      aria-controls="review-panel"
                    >
                      <Icon size="small" name={view().reviewPanel.opened() ? "review-active" : "review"} />
                    </Button>
                  </TooltipKeybind>

                  <TooltipKeybind
                    title={language.t("command.fileTree.toggle")}
                    keybind={command.keybind("fileTree.toggle")}
                  >
                    <Button
                      variant="ghost"
                      class="titlebar-icon w-8 h-8 p-0 box-border"
                      onClick={() => layout.fileTree.toggle()}
                      aria-label={language.t("command.fileTree.toggle")}
                      aria-expanded={layout.fileTree.opened()}
                      aria-controls="file-tree-panel"
                    >
                      <div class="relative flex items-center justify-center size-4">
                        <Icon
                          size="small"
                          name={layout.fileTree.opened() ? "file-tree-active" : "file-tree"}
                          classList={{
                            "text-icon-strong": layout.fileTree.opened(),
                            "text-icon-weak": !layout.fileTree.opened(),
                          }}
                        />
                      </div>
                    </Button>
                  </TooltipKeybind>
                </div>
              </div>
            </div>
          </Portal>
        )}
      </Show>
    </>
  )
}
