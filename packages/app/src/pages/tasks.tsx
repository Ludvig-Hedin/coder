import { Button } from "@opencode-ai/ui/button"
import { Dialog } from "@opencode-ai/ui/dialog"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Icon } from "@opencode-ai/ui/icon"
import { Select } from "@opencode-ai/ui/select"
import { Spinner } from "@opencode-ai/ui/spinner"
import { TextField } from "@opencode-ai/ui/text-field"
import {
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  Show,
  Suspense,
  type JSX,
} from "solid-js"
import { createStore } from "solid-js/store"
import { useLanguage } from "@/context/language"
import { type VkRepo, type VkWorkspace, type VkWorkspaceSummary, vibeKanban } from "@/utils/vibe-kanban-api"

// Status column classification from workspace + summary data
type TaskStatus = "todo" | "inprogress" | "done"

function getTaskStatus(summary: VkWorkspaceSummary | undefined): TaskStatus {
  if (!summary || summary.latest_process_status === null) return "todo"
  if (summary.latest_process_status === "running") return "inprogress"
  if (summary.latest_process_status === "completed") return "done"
  // failed / killed goes back to todo for re-running
  return "todo"
}

// ────────────────────────────────────────────────
// New Task dialog
// ────────────────────────────────────────────────
function DialogNewTask(props: { repos: VkRepo[]; onCreated: () => void }) {
  const dialog = useDialog()
  const language = useLanguage()
  const repoOptions = createMemo(() => props.repos.map((r) => r.id))
  const repoLabel = (id: string | undefined) => props.repos.find((r) => r.id === id)?.display_name ?? id ?? ""

  const [store, setStore] = createStore({
    name: "",
    repoId: props.repos[0]?.id ?? "",
    branch: props.repos[0]?.default_target_branch ?? "main",
    prompt: "",
    loading: false,
    error: "",
  })

  const ready = createMemo(() => !!store.name.trim() && !!store.repoId && !!store.prompt.trim())

  const onRepoChange = (id: string | undefined) => {
    if (!id) return
    const repo = props.repos.find((r) => r.id === id)
    setStore({ repoId: id, branch: repo?.default_target_branch ?? "main" })
  }

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    if (!ready() || store.loading) return
    setStore("loading", true)
    setStore("error", "")
    try {
      await vibeKanban.createAndStart({
        name: store.name,
        repoId: store.repoId,
        branch: store.branch,
        prompt: store.prompt,
      })
      props.onCreated()
      dialog.close()
    } catch (err) {
      setStore("error", err instanceof Error ? err.message : "Failed to create task")
    } finally {
      setStore("loading", false)
    }
  }

  return (
    <Dialog fit transition containerClass="tasks-dialog__container" class="tasks-dialog">
      <form class="tasks-dialog__form" onSubmit={submit}>
        <div class="tasks-dialog__head">
          <TextField
            autofocus
            class="tasks-dialog__name-input"
            hideLabel
            label={language.t("tasks.dialog.nameLabel")}
            placeholder={language.t("tasks.dialog.namePlaceholder")}
            value={store.name}
            onChange={(value) => setStore("name", value)}
          />
        </div>
        <div class="tasks-dialog__body">
          <TextField
            multiline
            hideLabel
            label="Prompt"
            class="tasks-dialog__prompt-input"
            placeholder="Describe what you want the AI agent to do..."
            value={store.prompt}
            onChange={(value) => setStore("prompt", value)}
            autoResize={false}
          />
        </div>
        <div class="tasks-dialog__footer">
          <div class="tasks-dialog__toolbar">
            <Show when={props.repos.length > 0}>
              <Select
                options={repoOptions()}
                current={store.repoId}
                onSelect={onRepoChange}
                variant="ghost"
                size="large"
                class="tasks-dialog__chip"
              >
                {(id) => (
                  <div class="flex min-w-0 items-center gap-2">
                    <Icon name="folder" size="small" />
                    <span class="truncate">{repoLabel(id)}</span>
                  </div>
                )}
              </Select>
            </Show>
            <TextField
              hideLabel
              label="Branch"
              placeholder="main"
              value={store.branch}
              onChange={(value) => setStore("branch", value)}
              class="tasks-dialog__branch-input"
            />
          </div>
          <Show when={store.error}>
            <p class="tasks-dialog__error">{store.error}</p>
          </Show>
          <div class="tasks-dialog__submit-row">
            <Button
              type="button"
              variant="ghost"
              size="large"
              onClick={() => dialog.close()}
            >
              Cancel
            </Button>
            <Button type="submit" size="large" disabled={!ready() || store.loading}>
              <Show when={store.loading} fallback={language.t("tasks.dialog.create")}>
                <Spinner class="size-4 mr-2" />
                Starting…
              </Show>
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}

// ────────────────────────────────────────────────
// Task card
// ────────────────────────────────────────────────
function TaskCard(props: {
  workspace: VkWorkspace
  summary: VkWorkspaceSummary | undefined
  onArchive: () => void
}): JSX.Element {
  const running = createMemo(() => props.summary?.latest_process_status === "running")
  const errored = createMemo(
    () =>
      props.summary?.latest_process_status === "failed" ||
      props.summary?.latest_process_status === "killed",
  )
  const filesChanged = createMemo(() => props.summary?.files_changed ?? 0)
  const linesAdded = createMemo(() => props.summary?.lines_added ?? 0)
  const linesRemoved = createMemo(() => props.summary?.lines_removed ?? 0)
  const displayName = createMemo(() => props.workspace.name ?? props.workspace.branch)

  return (
    <div class="tasks-card">
      <div class="tasks-card__header">
        <div class="tasks-card__status-dot">
          <Show
            when={running()}
            fallback={
              <div
                classList={{
                  "tasks-card__dot": true,
                  "tasks-card__dot--error": errored(),
                }}
              />
            }
          >
            <Spinner class="size-3.5 text-text-weak" />
          </Show>
        </div>
        <span class="tasks-card__name">{displayName()}</span>
      </div>
      <div class="tasks-card__meta">
        <span class="tasks-card__branch">
          <Icon name="branch" size="small" />
          {props.workspace.branch}
        </span>
        <Show when={filesChanged() > 0}>
          <span class="tasks-card__diff">
            <span class="tasks-card__added">+{linesAdded()}</span>
            <span class="tasks-card__removed">-{linesRemoved()}</span>
          </span>
        </Show>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// Kanban column
// ────────────────────────────────────────────────
function KanbanColumn(props: {
  title: string
  count: number
  children: JSX.Element
  empty: string
}): JSX.Element {
  return (
    <div class="tasks-column">
      <div class="tasks-column__header">
        <span class="tasks-column__title">{props.title}</span>
        <span class="tasks-column__count">{props.count}</span>
      </div>
      <div class="tasks-column__body">
        <Show when={props.count > 0} fallback={<p class="tasks-column__empty">{props.empty}</p>}>
          {props.children}
        </Show>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// Not configured banner
// ────────────────────────────────────────────────
function NotConfigured() {
  return (
    <div class="tasks-page">
      <div class="tasks-page__not-configured">
        <Icon name="settings-gear" size="medium" />
        <p>
          Tasks require a running vibe-kanban backend. Set{" "}
          <code>VITE_VIBE_KANBAN_URL</code> to your vibe-kanban Railway service URL.
        </p>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// Main Tasks page
// ────────────────────────────────────────────────
export default function Tasks() {
  const language = useLanguage()
  const dialog = useDialog()

  const configured = !!import.meta.env.VITE_VIBE_KANBAN_URL

  if (!configured) return <NotConfigured />

  const [refresh, setRefresh] = createSignal(0)

  const [workspaces] = createResource(
    () => refresh(),
    () => vibeKanban.listWorkspaces(),
  )

  const [repos] = createResource(
    () => refresh(),
    () => vibeKanban.listRepos(),
  )

  const [summaries] = createResource(
    () => refresh(),
    () => vibeKanban.getWorkspaceSummaries(false),
  )

  const summaryMap = createMemo(() => {
    const map = new Map<string, VkWorkspaceSummary>()
    for (const s of summaries() ?? []) map.set(s.workspace_id, s)
    return map
  })

  const activeWorkspaces = createMemo(() =>
    (workspaces() ?? []).filter((w) => !w.archived),
  )

  const todo = createMemo(() =>
    activeWorkspaces().filter((w) => getTaskStatus(summaryMap().get(w.id)) === "todo"),
  )
  const inProgress = createMemo(() =>
    activeWorkspaces().filter((w) => getTaskStatus(summaryMap().get(w.id)) === "inprogress"),
  )
  const done = createMemo(() =>
    activeWorkspaces().filter((w) => getTaskStatus(summaryMap().get(w.id)) === "done"),
  )

  const openNewTask = () => {
    dialog.show(() => (
      <DialogNewTask repos={repos() ?? []} onCreated={() => setRefresh((n) => n + 1)} />
    ))
  }

  const archiveTask = async (id: string) => {
    try {
      await vibeKanban.archiveWorkspace(id)
      setRefresh((n) => n + 1)
    } catch {
      // Silently swallow — task list will not update
    }
  }

  return (
    <div class="tasks-page">
      <div class="tasks-page__head">
        <h1 class="tasks-page__title">{language.t("tasks.title")}</h1>
        <Button size="large" icon="plus-small" class="tasks-page__new" onClick={openNewTask}>
          {language.t("tasks.new")}
        </Button>
      </div>

      <ErrorBoundary
        fallback={(err) => (
          <div class="tasks-page__error">
            <p>Could not connect to vibe-kanban backend: {String(err)}</p>
          </div>
        )}
      >
        <Suspense
          fallback={
            <div class="tasks-page__loading">
              <Spinner class="size-6 text-text-weak" />
            </div>
          }
        >
          <div class="tasks-board">
            <KanbanColumn
              title={language.t("tasks.status.todo")}
              count={todo().length}
              empty={language.t("tasks.empty")}
            >
              <For each={todo()}>
                {(ws) => (
                  <TaskCard
                    workspace={ws}
                    summary={summaryMap().get(ws.id)}
                    onArchive={() => archiveTask(ws.id)}
                  />
                )}
              </For>
            </KanbanColumn>

            <KanbanColumn
              title={language.t("tasks.status.inprogress")}
              count={inProgress().length}
              empty="No tasks running."
            >
              <For each={inProgress()}>
                {(ws) => (
                  <TaskCard
                    workspace={ws}
                    summary={summaryMap().get(ws.id)}
                    onArchive={() => archiveTask(ws.id)}
                  />
                )}
              </For>
            </KanbanColumn>

            <KanbanColumn
              title={language.t("tasks.status.done")}
              count={done().length}
              empty="No completed tasks."
            >
              <For each={done()}>
                {(ws) => (
                  <TaskCard
                    workspace={ws}
                    summary={summaryMap().get(ws.id)}
                    onArchive={() => archiveTask(ws.id)}
                  />
                )}
              </For>
            </KanbanColumn>
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
