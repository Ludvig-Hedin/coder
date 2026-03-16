import { Button } from "@opencode-ai/ui/button"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { TextField } from "@opencode-ai/ui/text-field"
import { showToast } from "@opencode-ai/ui/toast"
import { getFilename } from "@opencode-ai/util/path"
import { createMemo, createResource, createSignal, For, Show, type Component } from "solid-js"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"
import { useServer } from "@/context/server"
import { SettingsList } from "./settings-list"

type MemoryItem = {
  id: string
  memory?: string
  scope: "user" | "project"
  created_at?: string | null
  updated_at?: string | null
}

type MemoryResponse = {
  enabled: boolean
  memories: MemoryItem[]
}

export const SettingsMemory: Component = () => {
  const sdk = useGlobalSDK()
  const server = useServer()
  const globalSync = useGlobalSync()

  // Build Basic-auth headers matching the server's credentials
  const authHeaders = (): Record<string, string> => {
    const http = server.current?.http
    if (!http?.password) return {}
    return {
      Authorization: `Basic ${btoa(`${http.username ?? "opencode"}:${http.password}`)}`,
    }
  }

  // The directory used to resolve project-scoped memories.
  // Defaults to the currently active project, but the user can switch it.
  const activeDirectory = () => globalSync.data.path?.directory ?? ""
  const [selectedDirectory, setSelectedDirectory] = createSignal<string>("")

  // Resolve which directory is actually in use (fall back to active project)
  const directory = () => selectedDirectory() || activeDirectory()

  // Projects list sorted by most recently updated, same as new-session page
  const projects = createMemo(() =>
    globalSync.data.project
      .slice()
      .sort((a, b) => (b.time.updated ?? b.time.created) - (a.time.updated ?? a.time.created)),
  )

  // Display name for the currently selected project
  const selectedProjectName = createMemo(() => {
    const dir = directory()
    if (!dir) return "Select project"
    const match = projects().find((p) => p.worktree === dir)
    return match?.name || getFilename(dir) || "Select project"
  })

  const apiUrl = (path = "") =>
    `${sdk.url}/memory${path}?directory=${encodeURIComponent(directory())}`

  // Fetch all memories (user-level + project-level)
  const [memoriesData, { refetch }] = createResource<MemoryResponse>(async () => {
    const res = await fetch(apiUrl(), { headers: authHeaders() })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<MemoryResponse>
  })

  // Add-form state
  const [addText, setAddText] = createSignal("")
  const [addScope, setAddScope] = createSignal<"user" | "project">("user")
  const [adding, setAdding] = createSignal(false)

  // Inline-edit state
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [editText, setEditText] = createSignal("")
  const [saving, setSaving] = createSignal(false)

  const handleAdd = async () => {
    const text = addText().trim()
    if (!text) return
    setAdding(true)
    try {
      const res = await fetch(apiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text, scope: addScope() }),
      })
      if (!res.ok) throw new Error(await res.text())
      setAddText("")
      await refetch()
      showToast({ variant: "success", icon: "circle-check", title: "Memory added" })
    } catch (err) {
      showToast({ title: "Failed to add memory", description: String(err) })
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (id: string) => {
    const text = editText().trim()
    if (!text) return
    setSaving(true)
    try {
      const res = await fetch(apiUrl(`/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error(await res.text())
      setEditingId(null)
      await refetch()
      showToast({ variant: "success", icon: "circle-check", title: "Memory updated" })
    } catch (err) {
      showToast({ title: "Failed to update memory", description: String(err) })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/${id}`), {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (!res.ok && res.status !== 204) throw new Error(await res.text())
      await refetch()
      showToast({ variant: "success", icon: "circle-check", title: "Memory deleted" })
    } catch (err) {
      showToast({ title: "Failed to delete memory", description: String(err) })
    }
  }

  const startEdit = (item: MemoryItem) => {
    setEditingId(item.id)
    setEditText(item.memory ?? "")
  }

  const userMems = () => memoriesData()?.memories.filter((m) => m.scope === "user") ?? []
  const projectMems = () => memoriesData()?.memories.filter((m) => m.scope === "project") ?? []

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,var(--surface-stronger-non-alpha)_calc(100%_-_24px),transparent)]">
        <div class="flex flex-col gap-1 pt-6 pb-8 max-w-[720px]">
          <h2 class="text-16-medium text-text-strong">Memory</h2>
          <p class="text-13-regular text-text-weak">
            Facts the assistant has learned from your conversations. These are injected into every session automatically.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-8 max-w-[720px]">
        {/* Not configured */}
        <Show when={memoriesData()?.enabled === false}>
          <SettingsList>
            <div class="py-4 text-14-regular text-text-weak">
              Memory is disabled. Set{" "}
              <code class="px-1 py-0.5 rounded bg-surface-stronger text-text-strong text-12-regular">
                MEM0_API_KEY
              </code>{" "}
              on the server to enable long-term memory.
            </div>
          </SettingsList>
        </Show>

        {/* Loading */}
        <Show when={memoriesData.loading}>
          <div class="text-13-regular text-text-weak py-2">Loading memories…</div>
        </Show>

        {/* Error */}
        <Show when={memoriesData.error && !memoriesData.loading}>
          <SettingsList>
            <div class="py-4 text-13-regular text-text-weak">
              Failed to load memories: {String(memoriesData.error)}
            </div>
          </SettingsList>
        </Show>

        {/* Main content when enabled */}
        <Show when={memoriesData()?.enabled === true}>
          {/* Add memory form */}
          <div class="flex flex-col gap-1">
            <h3 class="text-14-medium text-text-strong pb-2">Add memory</h3>
            <SettingsList>
              <div class="flex flex-col gap-4 py-4">
                <TextField
                  label="Memory text"
                  multiline
                  value={addText()}
                  onChange={setAddText}
                  placeholder="e.g. Always use named exports. Prefer functional components."
                  class="min-h-20"
                />
                <div class="flex flex-wrap items-center gap-3">
                  {/* Scope toggle — clear active/inactive distinction */}
                  <div class="flex items-center rounded-lg border border-border-weak-base overflow-hidden">
                    <button
                      class={`px-3 py-1.5 text-12-medium transition-colors ${
                        addScope() === "user"
                          ? "bg-surface-stronger text-text-strong"
                          : "bg-transparent text-text-weaker hover:text-text-base"
                      }`}
                      onClick={() => setAddScope("user")}
                    >
                      All projects
                    </button>
                    <div class="w-px h-5 bg-border-weak-base" />
                    <button
                      class={`px-3 py-1.5 text-12-medium transition-colors ${
                        addScope() === "project"
                          ? "bg-surface-stronger text-text-strong"
                          : "bg-transparent text-text-weaker hover:text-text-base"
                      }`}
                      onClick={() => setAddScope("project")}
                    >
                      This project
                    </button>
                  </div>

                  <Button
                    onClick={() => void handleAdd()}
                    loading={adding()}
                    disabled={!addText().trim()}
                    icon="plus-small"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </SettingsList>
          </div>

          {/* Global memories */}
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 pb-2">
              <h3 class="text-14-medium text-text-strong">Global memories</h3>
              <span class="text-12-regular text-text-weaker">({userMems().length})</span>
            </div>
            <SettingsList>
              <Show
                when={userMems().length > 0}
                fallback={
                  <div class="py-4 text-14-regular text-text-weak">
                    No global memories yet. These apply across all projects.
                  </div>
                }
              >
                <For each={userMems()}>
                  {(item) => (
                    <MemoryRow
                      item={item}
                      isEditing={editingId() === item.id}
                      editText={editText()}
                      onEditTextChange={setEditText}
                      onStartEdit={() => startEdit(item)}
                      onSave={() => void handleUpdate(item.id)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => void handleDelete(item.id)}
                      saving={saving()}
                    />
                  )}
                </For>
              </Show>
            </SettingsList>
          </div>

          {/* Project memories — with project selector matching new-session page */}
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 pb-2">
              {/* Project dropdown — same pattern as new-session page */}
              <DropdownMenu>
                <DropdownMenu.Trigger
                  as="button"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-14-medium text-text-strong transition-colors hover:bg-surface-base-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-border-strong-base"
                  aria-label="Select project"
                >
                  <Icon name="folder" size="small" class="shrink-0 text-icon-base" />
                  <span class="truncate max-w-56">{selectedProjectName()}</span>
                  <Icon name="chevron-down" size="small" class="shrink-0 text-icon-base opacity-60" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content class="mt-1 w-72 rounded-[18px] p-3">
                    <div class="px-1 pb-2 text-12-medium text-text-weak">Project memories</div>
                    <div class="flex max-h-72 flex-col overflow-auto">
                      <For each={projects()}>
                        {(project) => {
                          const isActive = () => project.worktree === directory()
                          return (
                            <DropdownMenu.Item
                              class="rounded-lg px-0.5 py-0"
                              onSelect={() => {
                                setSelectedDirectory(project.worktree)
                                void refetch()
                              }}
                            >
                              <div class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-surface-base-hover">
                                <Icon name="folder" size="small" class="shrink-0 text-icon-base" />
                                <span class="min-w-0 flex-1 truncate text-13-medium text-text-strong">
                                  {project.name || getFilename(project.worktree)}
                                </span>
                                <Show when={isActive()}>
                                  <Icon name="check" size="small" class="shrink-0 text-icon-base" />
                                </Show>
                              </div>
                            </DropdownMenu.Item>
                          )
                        }}
                      </For>
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu>
              <span class="text-12-regular text-text-weaker">({projectMems().length})</span>
            </div>
            <SettingsList>
              <Show
                when={projectMems().length > 0}
                fallback={
                  <div class="py-4 text-14-regular text-text-weak">
                    No project memories yet. These are specific to this repository.
                  </div>
                }
              >
                <For each={projectMems()}>
                  {(item) => (
                    <MemoryRow
                      item={item}
                      isEditing={editingId() === item.id}
                      editText={editText()}
                      onEditTextChange={setEditText}
                      onStartEdit={() => startEdit(item)}
                      onSave={() => void handleUpdate(item.id)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => void handleDelete(item.id)}
                      saving={saving()}
                    />
                  )}
                </For>
              </Show>
            </SettingsList>
          </div>

          <Button
            variant="ghost"
            class="px-0 py-0 text-14-medium text-text-interactive-base justify-start hover:bg-transparent active:bg-transparent"
            onClick={() => void refetch()}
          >
            Reload memories
          </Button>
        </Show>
      </div>
    </div>
  )
}

// ─── MemoryRow ───────────────────────────────────────────────────────────────

type MemoryRowProps = {
  item: MemoryItem
  isEditing: boolean
  editText: string
  onEditTextChange: (v: string) => void
  onStartEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  saving: boolean
}

const MemoryRow: Component<MemoryRowProps> = (props) => {
  const formattedDate = () => {
    const raw = props.item.updated_at ?? props.item.created_at
    if (!raw) return ""
    try {
      return new Date(raw).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return ""
    }
  }

  return (
    <div class="group flex flex-col gap-2 py-3 border-b border-border-weak-base last:border-none">
      <Show
        when={props.isEditing}
        fallback={
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-14-regular text-text-base break-words">{props.item.memory}</p>
              <Show when={formattedDate()}>
                <span class="text-11-regular text-text-weaker mt-0.5 block">{formattedDate()}</span>
              </Show>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <IconButton icon="pencil-line" variant="ghost" size="small" onClick={props.onStartEdit} aria-label="Edit memory" />
              <IconButton icon="trash" variant="ghost" size="small" onClick={props.onDelete} aria-label="Delete memory" />
            </div>
          </div>
        }
      >
        <div class="flex flex-col gap-2">
          <TextField multiline value={props.editText} onChange={props.onEditTextChange} class="min-h-16" />
          <div class="flex items-center gap-2">
            <Button size="small" onClick={props.onSave} loading={props.saving}>Save</Button>
            <Button size="small" variant="ghost" onClick={props.onCancel}>Cancel</Button>
          </div>
        </div>
      </Show>
    </div>
  )
}
