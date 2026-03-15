import { A } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Spinner } from "@opencode-ai/ui/spinner"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { getFilename } from "@opencode-ai/util/path"
import { base64Encode } from "@opencode-ai/util/encode"
import { type Session } from "@opencode-ai/sdk/v2/client"
import { createMemo, createSignal, For, Show, type Accessor, type JSX } from "solid-js"
import { type LocalProject } from "@/context/layout"
import { useGlobalSync } from "@/context/global-sync"
import { useLanguage } from "@/context/language"
import { useNotification } from "@/context/notification"
import { getRelativeTime } from "@/utils/time"

type Item = {
  directory: string
  session: Session
}

const row = {
  radius: "12px",
  padX: "12px",
  padY: "10px",
  lineHeight: 1.1,
  dot: "10px",
  spinner: "16px",
} as const

const menu = {
  title: "Filter, sort, and organize threads",
  organize: "Organize",
  sort: "Sort by",
  show: "Show",
} as const

function sort(items: Item[]) {
  const now = Date.now() - 60 * 1000
  return items
    .slice()
    .sort((a, b) => {
      const at = a.session.time.updated ?? a.session.time.created
      const bt = b.session.time.updated ?? b.session.time.created
      const ar = at > now
      const br = bt > now
      if (ar && br) return a.session.id < b.session.id ? -1 : a.session.id > b.session.id ? 1 : 0
      if (ar && !br) return -1
      if (!ar && br) return 1
      return bt - at
    })
}

const SessionRow = (props: {
  item: Item
  active: Accessor<boolean>
  onArchive: (session: Session) => void
  onEdit: (session: Session) => void
  onRemove: (session: Session) => void
}): JSX.Element => {
  const globalSync = useGlobalSync()
  const language = useLanguage()
  const notification = useNotification()
  const [store] = globalSync.child(props.item.directory, { bootstrap: false })
  const href = createMemo(() => `/${base64Encode(props.item.directory)}/session/${props.item.session.id}`)
  const age = createMemo(() => getRelativeTime(new Date(props.item.session.time.updated).toISOString(), language.t))
  const add = createMemo(() => props.item.session.summary?.additions ?? 0)
  const del = createMemo(() => props.item.session.summary?.deletions ?? 0)
  const unread = createMemo(() => notification.session.unseenCount(props.item.session.id) > 0)
  const status = createMemo(() => store.session_status[props.item.session.id])
  const working = createMemo(() => {
    const value = status()
    return value !== undefined && value.type !== "idle"
  })
  const live = createMemo(() => store.session_diff[props.item.session.id] ?? [])
  const liveAdd = createMemo(() => live().reduce((sum, diff) => sum + (diff.additions ?? 0), 0))
  const liveDel = createMemo(() => live().reduce((sum, diff) => sum + (diff.deletions ?? 0), 0))
  const diffAdd = createMemo(() => (live().length > 0 ? liveAdd() : add()))
  const diffDel = createMemo(() => (live().length > 0 ? liveDel() : del()))
  const [menuOpen, setMenuOpen] = createSignal(false)
  const handleContext = (event: Event) => {
    event.preventDefault()
    setMenuOpen(true)
  }

  return (
    <div
      data-session-id={props.item.session.id}
      classList={{
        "group/thread relative": true,
        "bg-surface-base-active": props.active(),
        "hover:bg-surface-raised-base-hover": !props.active(),
      }}
      style={{ "border-radius": row.radius }}
    >
      <A
        href={href()}
        class="flex min-w-0 items-center gap-2 text-left"
        aria-current={props.active() ? "page" : undefined}
        onContextMenu={(event) => {
          handleContext(event)
        }}
        style={{
          "border-radius": row.radius,
          "padding-left": row.padX,
          "padding-right": row.padX,
          "padding-top": row.padY,
          "padding-bottom": row.padY,
        }}
      >
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <div class="flex size-5 shrink-0 items-center justify-center">
            <Show
              when={working()}
              fallback={
                <div
                  classList={{
                    "rounded-full transition-opacity": true,
                    "bg-[#76B7FF] opacity-100": unread(),
                    "opacity-0": !unread(),
                  }}
                  style={{ width: row.dot, height: row.dot }}
                />
              }
            >
              <Spinner class="shrink-0 text-text-weak" style={{ width: row.spinner, height: row.spinner }} />
            </Show>
          </div>
          <span
            class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-14-medium text-text-strong"
            style={{ "line-height": row.lineHeight.toString() }}
          >
            {props.item.session.title}
          </span>
        </div>
        <Show when={diffAdd() > 0}>
          <span class="shrink-0 text-14-medium text-icon-success-base" style={{ "line-height": row.lineHeight.toString() }}>
            +{diffAdd()}
          </span>
        </Show>
        <Show when={diffDel() > 0}>
          <span
            class="shrink-0 text-14-medium text-icon-critical-base"
            style={{ "line-height": row.lineHeight.toString() }}
          >
            -{diffDel()}
          </span>
        </Show>
        <span class="shrink-0 text-14-regular text-text-weak" style={{ "line-height": row.lineHeight.toString() }}>
          {age()}
        </span>
      </A>

      <div class="absolute right-9 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/thread:opacity-100 group-focus-within/thread:opacity-100">
        <DropdownMenu open={menuOpen()} onOpenChange={setMenuOpen}>
          <Tooltip value="Thread actions" placement="top">
        <DropdownMenu.Trigger
          as={IconButton}
          icon="dot-grid"
          variant="ghost"
          class="size-6 rounded-md text-icon-weak"
        />
          </Tooltip>
          <DropdownMenu.Portal>
            <DropdownMenu.Content class="mt-1 w-48 rounded-[18px] p-2">
              <DropdownMenu.Item
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-text-strong"
                onSelect={() => {
                  setMenuOpen(false)
                  props.onEdit(props.item.session)
                }}
              >
                <div class="flex size-5 shrink-0 items-center justify-center text-icon-weak">
                  <Icon name="pencil-line" size="small" />
                </div>
                <DropdownMenu.ItemLabel class="min-w-0 flex-1 text-14-medium">Edit name</DropdownMenu.ItemLabel>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-text-strong"
                onSelect={() => {
                  setMenuOpen(false)
                  props.onRemove(props.item.session)
                }}
              >
                <div class="flex size-5 shrink-0 items-center justify-center text-icon-critical-base">
                  <Icon name="trash" size="small" />
                </div>
                <DropdownMenu.ItemLabel class="min-w-0 flex-1 text-14-medium">Remove</DropdownMenu.ItemLabel>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu>
      </div>

      <div class="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/thread:opacity-100 group-focus-within/thread:opacity-100">
        <IconButton
          icon="archive"
          variant="ghost"
          class="size-6 rounded-md"
          aria-label={language.t("common.archive")}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            props.onArchive(props.item.session)
          }}
        />
      </div>
    </div>
  )
}

const ProjectSection = (props: {
  project: LocalProject
  currentDir: Accessor<string>
  currentSession: Accessor<string | undefined>
  workspaces: (project: LocalProject) => string[]
  sessions: (directory: string) => Session[]
  expanded: (project: LocalProject) => boolean
  onSelect: (project: LocalProject) => void
  onToggle: (project: LocalProject) => void
  onNew: (project: LocalProject) => void
  onEdit: (project: LocalProject) => void
  onRemove: (project: LocalProject) => void
  onArchive: (session: Session) => void
  onEditThread: (session: Session) => void
  onRemoveThread: (session: Session) => void
}): JSX.Element => {
  const selected = createMemo(() => props.project.worktree === props.currentDir())
  const name = createMemo(() => props.project.name || getFilename(props.project.worktree))
  const items = createMemo(() =>
    sort(
      props
        .workspaces(props.project)
        .flatMap((directory) => props.sessions(directory).map((session) => ({ directory, session }))),
    ),
  )
  const open = createMemo(() => props.expanded(props.project))

  const [menuOpen, setMenuOpen] = createSignal(false)
  const handleContext = (event: Event) => {
    event.preventDefault()
    setMenuOpen(true)
  }

  return (
    <section class="flex flex-col gap-1">
      <div
        class="group/project flex min-w-0 items-center gap-1 hover:bg-surface-raised-base-hover"
        style={{
          "border-radius": row.radius,
          "padding-left": row.padX,
          "padding-right": row.padX,
          "padding-top": row.padY,
          "padding-bottom": row.padY,
        }}
        onContextMenu={(event) => {
          handleContext(event)
        }}
      >
        <IconButton
          icon="chevron-down"
          variant="ghost"
          class="size-5 shrink-0 rounded-md text-icon-weak transition-transform"
          classList={{ "-rotate-90": !open() }}
          aria-label={open() ? "Collapse project" : "Expand project"}
          onClick={() => {
            props.onToggle(props.project)
          }}
        />
        <button type="button" class="flex min-w-0 flex-1 items-center text-left" onClick={() => props.onSelect(props.project)}>
          <span
            classList={{
              "truncate text-16-medium text-text-weak": true,
              "text-text-base": selected(),
            }}
            style={{ "line-height": row.lineHeight.toString() }}
          >
            {name()}
          </span>
        </button>
        <DropdownMenu open={menuOpen()} onOpenChange={setMenuOpen}>
          <Tooltip value="Project actions" placement="top">
        <DropdownMenu.Trigger
          as={IconButton}
          icon="dot-grid"
          variant="ghost"
          class="size-5 rounded-md text-icon-weak opacity-0 transition-opacity group-hover/project:opacity-100 group-focus-within/project:opacity-100"
          aria-label="Project actions"
        />
          </Tooltip>
          <DropdownMenu.Portal>
            <DropdownMenu.Content class="mt-1 w-56 rounded-[18px] p-2">
            <DropdownMenu.Item
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-text-strong"
              onSelect={() => {
                setMenuOpen(false)
                props.onEdit(props.project)
              }}
            >
                <div class="flex size-5 shrink-0 items-center justify-center text-icon-weak">
                  <Icon name="pencil-line" size="small" />
                </div>
                <DropdownMenu.ItemLabel class="min-w-0 flex-1 text-14-medium">Edit name</DropdownMenu.ItemLabel>
              </DropdownMenu.Item>
            <DropdownMenu.Item
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-text-strong"
              onSelect={() => {
                setMenuOpen(false)
                props.onRemove(props.project)
              }}
            >
                <div class="flex size-5 shrink-0 items-center justify-center text-icon-critical-base">
                  <Icon name="trash" size="small" />
                </div>
                <DropdownMenu.ItemLabel class="min-w-0 flex-1 text-14-medium">Remove</DropdownMenu.ItemLabel>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu>
      </div>

      <Show when={open() && items().length > 0}>
        <div class="flex flex-col gap-0.5 pb-1">
          <For each={items()}>
            {(item) => (
              <SessionRow
                item={item}
                active={() => props.currentSession() === item.session.id}
                onArchive={props.onArchive}
                onEdit={props.onEditThread}
                onRemove={props.onRemoveThread}
              />
            )}
          </For>
        </div>
      </Show>
    </section>
  )
}

export const SidebarThreadList = (props: {
  mobile?: boolean
  projects: Accessor<LocalProject[]>
  currentDir: Accessor<string>
  currentSession: Accessor<string | undefined>
  workspaces: (project: LocalProject) => string[]
  sessions: (directory: string) => Session[]
  expanded: (project: LocalProject) => boolean
  onSelectProject: (project: LocalProject) => void
  onToggleProject: (project: LocalProject) => void
  onNewProject: (project: LocalProject) => void
  onEditProject: (project: LocalProject) => void
  onRemoveProject: (project: LocalProject) => void
  onArchive: (session: Session) => void
  onNew: () => void
  onOpenProject: () => void
  onOpenSettings: () => void
  onEditThread: (session: Session) => void
  onRemoveThread: (session: Session) => void
}): JSX.Element => {
  const language = useLanguage()
  const [organize, setOrganize] = createSignal<"project" | "chronological">("project")
  const [order, setOrder] = createSignal<"updated" | "created">("updated")
  const [scope, setScope] = createSignal<"all" | "relevant">("all")

  const Item = (itemProps: {
    icon: "folder" | "bullet-list" | "plus-small" | "pencil-line" | "bubble-5" | "models"
    label: string
    active: boolean
    onSelect: () => void
  }) => (
    <DropdownMenu.Item
      class="flex items-center gap-3 rounded-lg px-3 py-2 text-text-strong"
      onSelect={itemProps.onSelect}
    >
      <div class="flex size-5 shrink-0 items-center justify-center text-icon-weak">
        <Icon name={itemProps.icon} size="small" />
      </div>
      <DropdownMenu.ItemLabel class="min-w-0 flex-1 text-14-medium">{itemProps.label}</DropdownMenu.ItemLabel>
      <Show when={itemProps.active}>
        <div class="flex size-5 shrink-0 items-center justify-center text-text-strong">
          <Icon name="check-small" size="small" />
        </div>
      </Show>
    </DropdownMenu.Item>
  )

  return (
    <div
      classList={{
        "flex h-full min-h-0 flex-col bg-background-base": true,
        "border-l border-t border-border-weaker-base rounded-tl-[12px]": !props.mobile,
      }}
    >
      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-3 pt-4">
        <Button
          variant="ghost"
          class="h-11 justify-start text-17-medium text-text-strong hover:bg-surface-raised-base-hover"
          icon="new-session"
          onClick={props.onNew}
          style={{
            "border-radius": row.radius,
            "padding-left": row.padX,
            "padding-right": row.padX,
            "line-height": row.lineHeight.toString(),
          }}
        >
          New thread
        </Button>

        <section class="flex flex-col gap-2">
          <div class="flex items-center justify-between px-5">
            <div class="text-13-medium text-text-weak">Threads</div>
            <div class="flex items-center gap-1">
              <IconButton
                icon="folder-add-left"
                variant="ghost"
                class="size-7 rounded-lg"
                aria-label={language.t("command.project.open")}
                onClick={props.onOpenProject}
              />
              <DropdownMenu>
                <Tooltip value={menu.title} placement="top">
                  <DropdownMenu.Trigger
                    as={IconButton}
                    icon="sliders"
                    variant="ghost"
                    class="size-7 rounded-lg"
                    aria-label={menu.title}
                  />
                </Tooltip>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content class="mt-1 w-72 rounded-[18px] p-2">
                    <div class="px-3 pb-2 pt-1 text-14-medium text-text-weak">{menu.organize}</div>
                    <Item
                      icon="folder"
                      label="By project"
                      active={organize() === "project"}
                      onSelect={() => setOrganize("project")}
                    />
                    <Item
                      icon="bullet-list"
                      label="Chronological list"
                      active={organize() === "chronological"}
                      onSelect={() => setOrganize("chronological")}
                    />
                    <DropdownMenu.Separator class="my-2" />
                    <div class="px-3 pb-2 pt-1 text-14-medium text-text-weak">{menu.sort}</div>
                    <Item
                      icon="plus-small"
                      label="Created"
                      active={order() === "created"}
                      onSelect={() => setOrder("created")}
                    />
                    <Item
                      icon="pencil-line"
                      label="Updated"
                      active={order() === "updated"}
                      onSelect={() => setOrder("updated")}
                    />
                    <DropdownMenu.Separator class="my-2" />
                    <div class="px-3 pb-2 pt-1 text-14-medium text-text-weak">{menu.show}</div>
                    <Item
                      icon="bubble-5"
                      label="All threads"
                      active={scope() === "all"}
                      onSelect={() => setScope("all")}
                    />
                    <Item
                      icon="models"
                      label="Relevant"
                      active={scope() === "relevant"}
                      onSelect={() => setScope("relevant")}
                    />
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <For each={props.projects()}>
              {(project) => (
                <ProjectSection
                  project={project}
                  currentDir={props.currentDir}
                  currentSession={props.currentSession}
                  workspaces={props.workspaces}
                  sessions={props.sessions}
                  expanded={props.expanded}
                  onSelect={props.onSelectProject}
                onToggle={props.onToggleProject}
                onNew={props.onNewProject}
                onEdit={props.onEditProject}
                onRemove={props.onRemoveProject}
                onEditThread={props.onEditThread}
                onRemoveThread={props.onRemoveThread}
                onArchive={props.onArchive}
              />
            )}
            </For>
          </div>
        </section>
      </div>

      <div class="shrink-0 px-3 pb-3 pt-1">
        <Button
          variant="ghost"
          class="h-11 w-full justify-start text-17-medium text-text-base hover:bg-surface-raised-base-hover"
          icon="settings-gear"
          onClick={props.onOpenSettings}
          style={{
            "border-radius": row.radius,
            "padding-left": row.padX,
            "padding-right": row.padX,
            "line-height": row.lineHeight.toString(),
          }}
        >
          {language.t("sidebar.settings")}
        </Button>
      </div>
    </div>
  )
}
