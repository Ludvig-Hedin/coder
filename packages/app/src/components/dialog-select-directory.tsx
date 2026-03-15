import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { FileIcon } from "@opencode-ai/ui/file-icon"
import { Icon } from "@opencode-ai/ui/icon"
import { List } from "@opencode-ai/ui/list"
import type { ListRef } from "@opencode-ai/ui/list"
import { TextField } from "@opencode-ai/ui/text-field"
import { showToast } from "@opencode-ai/ui/toast"
import { getDirectory, getFilename } from "@opencode-ai/util/path"
import fuzzysort from "fuzzysort"
import { createEffect, createMemo, createResource, createSignal, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"
import { useLayout } from "@/context/layout"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { useServer } from "@/context/server"

interface DialogSelectDirectoryProps {
  title?: string
  multiple?: boolean
  onSelect: (result: string | string[] | null) => void
}

type Row = {
  absolute: string
  search: string
  group: "recent" | "folders" | "browser"
  mode: "open" | "browse"
}

function hidden(input: string) {
  return getFilename(trimTrailing(input)).startsWith(".")
}

function cleanInput(value: string) {
  const first = (value ?? "").split(/\r?\n/)[0] ?? ""
  return first.replace(/[\u0000-\u001F\u007F]/g, "").trim()
}

function normalizePath(input: string) {
  const v = input.replaceAll("\\", "/")
  if (v.startsWith("//") && !v.startsWith("///")) return "//" + v.slice(2).replace(/\/+/g, "/")
  return v.replace(/\/+/g, "/")
}

function normalizeDriveRoot(input: string) {
  const v = normalizePath(input)
  if (/^[A-Za-z]:$/.test(v)) return v + "/"
  return v
}

function trimTrailing(input: string) {
  const v = normalizeDriveRoot(input)
  if (v === "/") return v
  if (v === "//") return v
  if (/^[A-Za-z]:\/$/.test(v)) return v
  return v.replace(/\/+$/, "")
}

function joinPath(base: string | undefined, rel: string) {
  const b = trimTrailing(base ?? "")
  const r = trimTrailing(rel).replace(/^\/+/, "")
  if (!b) return r
  if (!r) return b
  if (b.endsWith("/")) return b + r
  return b + "/" + r
}

function rootOf(input: string) {
  const v = normalizeDriveRoot(input)
  if (v.startsWith("//")) return "//"
  if (v.startsWith("/")) return "/"
  if (/^[A-Za-z]:\//.test(v)) return v.slice(0, 3)
  return ""
}

function parentOf(input: string) {
  const v = trimTrailing(input)
  if (v === "/") return v
  if (v === "//") return v
  if (/^[A-Za-z]:\/$/.test(v)) return v

  const i = v.lastIndexOf("/")
  if (i <= 0) return "/"
  if (i === 2 && /^[A-Za-z]:/.test(v)) return v.slice(0, 3)
  return v.slice(0, i)
}

function modeOf(input: string) {
  const raw = normalizeDriveRoot(input.trim())
  if (!raw) return "relative" as const
  if (raw.startsWith("~")) return "tilde" as const
  if (rootOf(raw)) return "absolute" as const
  return "relative" as const
}

function tildeOf(absolute: string, home: string) {
  const full = trimTrailing(absolute)
  if (!home) return ""

  const hn = trimTrailing(home)
  const lc = full.toLowerCase()
  const hc = hn.toLowerCase()
  if (lc === hc) return "~"
  if (lc.startsWith(hc + "/")) return "~" + full.slice(hn.length)
  return ""
}

function displayPath(path: string, input: string, home: string) {
  const full = trimTrailing(path)
  if (modeOf(input) === "absolute") return full
  return tildeOf(full, home) || full
}

function toRow(absolute: string, home: string, group: Row["group"], mode: Row["mode"]): Row {
  const full = trimTrailing(absolute)
  const tilde = tildeOf(full, home)
  const withSlash = (value: string) => {
    if (!value) return ""
    if (value.endsWith("/")) return value
    return value + "/"
  }

  const search = Array.from(
    new Set([full, withSlash(full), tilde, withSlash(tilde), getFilename(full)].filter(Boolean)),
  ).join("\n")
  return { absolute: full, search, group, mode }
}

function uniqueRows(rows: Row[]) {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = `${row.mode}:${row.absolute}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === "string" && err) return err
  return fallback
}

function useDirectoryBrowser(args: {
  sdk: ReturnType<typeof useGlobalSDK>
  start: () => string | undefined
  home: () => string
}) {
  const cache = new Map<string, Promise<Array<{ name: string; absolute: string }>>>()
  let current = 0

  const scoped = (value: string) => {
    const base = args.start()
    if (!base) return

    const raw = normalizeDriveRoot(value)
    if (!raw) return { directory: trimTrailing(base), path: "" }

    const h = args.home()
    if (raw === "~") return { directory: trimTrailing(h || base), path: "" }
    if (raw.startsWith("~/")) return { directory: trimTrailing(h || base), path: raw.slice(2) }

    const root = rootOf(raw)
    if (root) return { directory: trimTrailing(root), path: raw.slice(root.length) }
    return { directory: trimTrailing(base), path: raw }
  }

  const list = async (dir: string) => {
    const key = trimTrailing(dir)
    const existing = cache.get(key)
    if (existing) return existing

    const request = args.sdk.client.file
      .list({ directory: key, path: "" })
      .then((x) => x.data ?? [])
      .catch(() => [])
      .then((nodes) =>
        nodes
          .filter((n) => n.type === "directory")
          .filter((n) => !n.name.startsWith("."))
          .map((n) => ({
            name: n.name,
            absolute: trimTrailing(normalizeDriveRoot(n.absolute)),
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )

    cache.set(key, request)
    return request
  }

  const match = async (dir: string, query: string, limit: number) => {
    const items = await list(dir)
    if (!query) return items.slice(0, limit).map((x) => x.absolute)
    return fuzzysort.go(query, items, { key: "name", limit }).map((x) => x.obj.absolute)
  }

  return {
    clear(dir?: string) {
      if (!dir) {
        cache.clear()
        return
      }
      cache.delete(trimTrailing(dir))
    },
    list: (dir: string) => list(dir).then((items) => items.map((item) => item.absolute)),
    async search(filter: string) {
      const token = ++current
      const active = () => token === current

      const value = cleanInput(filter)
      const scopedInput = scoped(value)
      if (!scopedInput) return [] as string[]

      const raw = normalizeDriveRoot(value)
      const isPath = raw.startsWith("~") || !!rootOf(raw) || raw.includes("/")
      const query = normalizeDriveRoot(scopedInput.path)

      const find = () =>
        args.sdk.client.find
          .files({ directory: scopedInput.directory, query, type: "directory", limit: 50 })
          .then((x) => x.data ?? [])
          .catch(() => [])

      if (!isPath) {
        const results = await find()
        if (!active()) return []
        return results
          .map((rel) => joinPath(scopedInput.directory, rel))
          .filter((item) => !hidden(item))
          .slice(0, 50)
      }

      const segments = query.replace(/^\/+/, "").split("/")
      const head = segments.slice(0, segments.length - 1).filter((x) => x && x !== ".")
      const tail = segments[segments.length - 1] ?? ""

      const cap = 12
      const branch = 4
      let paths = [scopedInput.directory]
      for (const part of head) {
        if (!active()) return []
        if (part === "..") {
          paths = paths.map(parentOf)
          continue
        }

        const next = (await Promise.all(paths.map((p) => match(p, part, branch)))).flat()
        if (!active()) return []
        paths = Array.from(new Set(next)).slice(0, cap)
        if (paths.length === 0) return [] as string[]
      }

      const out = (await Promise.all(paths.map((p) => match(p, tail, 50)))).flat()
      if (!active()) return []
      const deduped = Array.from(new Set(out)).filter((item) => !hidden(item))
      const base = raw.startsWith("~") ? trimTrailing(scopedInput.directory) : ""
      const expand = !raw.endsWith("/")
      if (!expand || !tail) {
        const items = base ? Array.from(new Set([base, ...deduped])) : deduped
        return items.slice(0, 50)
      }

      const needle = tail.toLowerCase()
      const exact = deduped.filter((p) => getFilename(p).toLowerCase() === needle)
      const target = exact[0]
      if (!target) return deduped.slice(0, 50)

      const children = await match(target, "", 30)
      if (!active()) return []
      const items = Array.from(new Set([...deduped, ...children]))
      return (base ? Array.from(new Set([base, ...items])) : items).slice(0, 50)
    },
  }
}

export function DialogSelectDirectory(props: DialogSelectDirectoryProps) {
  const sync = useGlobalSync()
  const sdk = useGlobalSDK()
  const layout = useLayout()
  const dialog = useDialog()
  const language = useLanguage()
  const platform = usePlatform()
  const server = useServer()

  const [filter, setFilter] = createSignal("")
  const [tick, setTick] = createSignal(0)
  const [store, setStore] = createStore({
    creating: false,
    name: "",
    saving: false,
  })
  let list: ListRef | undefined

  const missingBase = createMemo(() => !(sync.data.path.home || sync.data.path.directory))
  const [fallbackPath] = createResource(
    () => (missingBase() ? true : undefined),
    async () => {
      return sdk.client.path
        .get()
        .then((x) => x.data)
        .catch(() => undefined)
    },
    { initialValue: undefined },
  )

  const home = createMemo(() => sync.data.path.home || fallbackPath()?.home || "")
  const start = createMemo(
    () => sync.data.path.home || sync.data.path.directory || fallbackPath()?.home || fallbackPath()?.directory,
  )
  const [cwd, setCwd] = createSignal("")

  const browser = useDirectoryBrowser({
    sdk,
    home,
    start,
  })

  const current = createMemo(() => trimTrailing(cwd() || start() || ""))
  const atRoot = createMemo(() => {
    const dir = current()
    if (!dir) return true
    return parentOf(dir) === dir
  })
  const title = createMemo(() => props.title ?? language.t("command.project.open"))
  const currentLabel = createMemo(() => displayPath(current(), "", home()))
  const canPickNative = createMemo(() => !!platform.openDirectoryPickerDialog && server.isLocal())
  const help = createMemo(() => {
    if (canPickNative()) return "Browse below, or use File explorer for the system picker."
    return "Click a folder to enter it. Use Open to select the current folder."
  })

  const recentProjects = createMemo(() => {
    const projects = layout.projects.list()
    const byProject = new Map<string, number>()

    for (const project of projects) {
      let at = 0
      const dirs = [project.worktree, ...(project.sandboxes ?? [])]
      for (const directory of dirs) {
        const sessions = sync.child(directory, { bootstrap: false })[0].session
        for (const session of sessions) {
          if (session.time.archived) continue
          const updated = session.time.updated ?? session.time.created
          if (updated > at) at = updated
        }
      }
      byProject.set(project.worktree, at)
    }

    return projects
      .map((project, index) => ({ project, at: byProject.get(project.worktree) ?? 0, index }))
      .sort((a, b) => b.at - a.at || a.index - b.index)
      .slice(0, 5)
      .map(({ project }) => {
        const row = toRow(project.worktree, home(), "recent", "browse")
        const name = project.name || getFilename(project.worktree)
        return {
          ...row,
          search: `${row.search}\n${name}`,
        }
      })
  })

  createEffect(() => {
    const dir = start()
    if (!cwd() && dir) setCwd(trimTrailing(dir))
  })

  const refresh = () => setTick((value) => value + 1)

  const items = async (value: string) => {
    tick()
    const query = cleanInput(value)
    if (!query) {
      const dir = current()
      const rows = dir ? (await browser.list(dir)).map((absolute) => toRow(absolute, home(), "browser", "browse")) : []
      return uniqueRows([...rows, ...recentProjects()])
    }

    const results = await browser.search(query)
    const rows = results.map((absolute) => toRow(absolute, home(), "folders", "browse"))
    return uniqueRows([...recentProjects(), ...rows])
  }

  function resolve(absolute: string) {
    props.onSelect(props.multiple ? [absolute] : absolute)
    dialog.close()
  }

  async function pick() {
    if (!canPickNative()) return
    const result = await platform.openDirectoryPickerDialog?.({
      title: title(),
      multiple: props.multiple,
    })
    if (!result) return
    props.onSelect(result)
    dialog.close()
  }

  async function mkdir() {
    const name = cleanInput(store.name)
    if (!name) return

    setStore("saving", true)
    await sdk.client.file
      .mkdir({
        directory: current(),
        path: "",
        name,
      })
      .then((x) => {
        const next = x.data?.absolute ? trimTrailing(x.data.absolute) : joinPath(current(), name)
        browser.clear(current())
        browser.clear(next)
        setCwd(next)
        setStore("name", "")
        setStore("creating", false)
        setFilter("")
        list?.setFilter("")
        refresh()
      })
      .catch((err) => {
        showToast({
          variant: "error",
          title: language.t("common.requestFailed"),
          description: errorMessage(err, language.t("common.requestFailed")),
        })
      })
      .finally(() => {
        setStore("saving", false)
      })
  }

  return (
    <Dialog
      title={title()}
      class="w-full max-w-[960px] mx-auto"
      description={
        <div class="min-w-0 flex flex-col gap-1 text-12-regular text-text-weak">
          <div class="min-w-0 flex items-center gap-2">
            <Icon name="folder" size="small" />
            <span class="truncate">{currentLabel() || "~"}</span>
          </div>
          <span>{help()}</span>
        </div>
      }
      action={
        <div class="flex items-center gap-2">
          <Show when={canPickNative()}>
            <Button type="button" variant="ghost" size="normal" icon="folder-add-left" onClick={() => void pick()}>
              File explorer
            </Button>
          </Show>
          <Button
            type="button"
            variant="ghost"
            size="normal"
            icon="chevron-left"
            disabled={atRoot()}
            onClick={() => {
              const dir = current()
              if (!dir) return
              setCwd(parentOf(dir))
              setFilter("")
              list?.setFilter("")
              refresh()
            }}
          >
            Up
          </Button>
          <Button
            type="button"
            variant={store.creating ? "secondary" : "ghost"}
            size="normal"
            icon="plus"
            onClick={() => setStore("creating", (value) => !value)}
          >
            New folder
          </Button>
          <Button
            type="button"
            variant="primary"
            size="normal"
            onClick={() => resolve(current())}
            disabled={!current()}
          >
            {language.t("common.open")}
          </Button>
        </div>
      }
    >
      <div class="flex h-[70vh] min-h-0 flex-col gap-3">
        <Show when={store.creating}>
          <form
            class="px-1 flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              void mkdir()
            }}
          >
            <TextField
              autofocus
              class="flex-1"
              label="Folder name"
              hideLabel
              placeholder="New folder name"
              value={store.name}
              onChange={(value) => setStore("name", value)}
            />
            <Button type="submit" size="normal" disabled={store.saving || !cleanInput(store.name)}>
              {store.saving ? language.t("common.loading") : "Create"}
            </Button>
          </form>
        </Show>
        <List
          class="flex-1 min-h-0 [&_[data-slot=list-scroll]]:flex-1 [&_[data-slot=list-scroll]]:min-h-0"
          search={{ placeholder: language.t("dialog.directory.search.placeholder"), autofocus: !store.creating }}
          emptyMessage={language.t("dialog.directory.empty")}
          loadingMessage={language.t("common.loading")}
          items={items}
          key={(x) => `${x.mode}:${x.absolute}`}
          filterKeys={["search"]}
          groupBy={(item) => item.group}
          sortGroupsBy={(a, b) => {
            const order = ["browser", "recent", "folders"]
            return order.indexOf(a.category) - order.indexOf(b.category)
          }}
          groupHeader={(group) => {
            if (group.category === "browser") return "Folders in current location"
            if (group.category === "recent") return language.t("home.recentProjects")
            return "Search results"
          }}
          ref={(r) => (list = r)}
          onFilter={(value) => setFilter(cleanInput(value))}
          onKeyEvent={(e, item) => {
            if (e.key !== "Tab") return
            if (e.shiftKey) return
            if (!item) return

            e.preventDefault()
            e.stopPropagation()

            const value = displayPath(item.absolute, filter(), home())
            list?.setFilter(value.endsWith("/") ? value : value + "/")
          }}
          onSelect={(item) => {
            if (!item) return
            setCwd(item.absolute)
            setFilter("")
            list?.setFilter("")
            refresh()
          }}
        >
          {(item) => {
            const path = displayPath(item.absolute, filter(), home())
            const open = item.mode === "open"
            return (
              <div class="w-full flex items-center justify-between rounded-md">
                <div class="flex items-center gap-x-3 grow min-w-0">
                  <FileIcon node={{ path: item.absolute, type: "directory" }} class="shrink-0 size-4" />
                  <div class="min-w-0 flex flex-col text-left">
                    <span class="truncate text-14-regular text-text-strong">{getFilename(path)}</span>
                    <span class="truncate text-12-regular text-text-weak">{getDirectory(path) || path}</span>
                  </div>
                </div>
                <Show when={!open}>
                  <Icon name="chevron-right" size="small" class="text-text-weaker" />
                </Show>
              </div>
            )
          }}
        </List>
      </div>
    </Dialog>
  )
}
