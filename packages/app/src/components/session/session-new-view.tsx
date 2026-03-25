import { For, Show, createMemo } from "solid-js"
import { DateTime } from "luxon"
import { useNavigate } from "@solidjs/router"
import { useSync } from "@/context/sync"
import { useSDK } from "@/context/sdk"
import { useLanguage } from "@/context/language"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { useGlobalSync } from "@/context/global-sync"
import { useLayout } from "@/context/layout"
import { useServer } from "@/context/server"
import { DialogSelectDirectory } from "@/components/dialog-select-directory"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { Icon } from "@opencode-ai/ui/icon"
import { Mark } from "@opencode-ai/ui/logo"
import { base64Encode } from "@opencode-ai/util/encode"
import { getDirectory, getFilename } from "@opencode-ai/util/path"

const MAIN_WORKTREE = "main"
const CREATE_WORKTREE = "create"
const ROOT_CLASS = "size-full flex flex-col"

interface NewSessionViewProps {
  worktree: string
}

export function NewSessionView(props: NewSessionViewProps) {
  const sync = useSync()
  const globalSync = useGlobalSync()
  const sdk = useSDK()
  const language = useLanguage()
  const dialog = useDialog()
  const layout = useLayout()
  const navigate = useNavigate()
  const server = useServer()

  const sandboxes = createMemo(() => sync.project?.sandboxes ?? [])
  const options = createMemo(() => [MAIN_WORKTREE, ...sandboxes(), CREATE_WORKTREE])
  const current = createMemo(() => {
    const selection = props.worktree
    if (options().includes(selection)) return selection
    return MAIN_WORKTREE
  })
  const projectRoot = createMemo(() => sync.project?.worktree ?? sdk.directory)
  const projectDir = createMemo(() => getDirectory(projectRoot()))
  const projectName = createMemo(() => getFilename(projectRoot()))
  const isWorktree = createMemo(() => {
    const project = sync.project
    if (!project) return false
    return sdk.directory !== project.worktree
  })
  const projects = createMemo(() =>
    globalSync.data.project
      .slice()
      .sort((a, b) => (b.time.updated ?? b.time.created) - (a.time.updated ?? a.time.created)),
  )

  const label = (value: string) => {
    if (value === MAIN_WORKTREE) {
      if (isWorktree()) return language.t("session.new.worktree.main")
      const branch = sync.data.vcs?.branch
      if (branch) return language.t("session.new.worktree.mainWithBranch", { branch })
      return language.t("session.new.worktree.main")
    }

    if (value === CREATE_WORKTREE) return language.t("session.new.worktree.create")

    return getFilename(value)
  }

  function openProject(directory: string) {
    layout.projects.open(directory)
    server.projects.touch(directory)
    navigate(`/${base64Encode(directory)}/session`)
  }

  function pickProject() {
    const resolve = (result: string | string[] | null) => {
      const directory = Array.isArray(result) ? result[0] : result
      if (!directory) return
      openProject(directory)
    }

    dialog.show(() => <DialogSelectDirectory title={language.t("session.new.project.add")} onSelect={resolve} />)
  }

  return (
    <div class={ROOT_CLASS}>
      <div class="h-12 shrink-0" aria-hidden />
      <div class="flex-1 px-6 pb-30 flex items-center justify-center text-center">
        <div class="w-full max-w-180 flex flex-col items-center text-center gap-4">
          <div class="flex flex-col items-center gap-5">
            <div class="rounded-[4px] overflow-hidden">
              <Mark class="w-10" />
            </div>
            <div class="text-20-medium text-text-strong">{language.t("session.new.title")}</div>
          </div>
          <div class="w-full flex flex-col gap-3 items-center">
            <div class="flex flex-col items-center gap-0.5 min-w-0 max-w-160">
              <div class="max-w-full truncate text-center text-13-medium leading-5 text-text-weaker opacity-80 select-text">
                {projectDir()}
              </div>
              <DropdownMenu>
                <DropdownMenu.Trigger
                  as="button"
                  type="button"
                  class="inline-flex max-w-full items-center justify-center gap-1.5 rounded-xl px-2 py-0.5 text-[38px] font-medium leading-none tracking-[-0.03em] text-text-strong transition-colors hover:bg-surface-base-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-border-strong-base"
                  aria-label={language.t("session.new.project.select")}
                >
                  <span class="truncate">{projectName()}</span>
                  <Icon name="chevron-down" size="small" class="mt-1 shrink-0 text-icon-base" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content class="mt-2 w-88 rounded-[22px] p-4">
                    <div class="px-1 pb-2 text-14-medium text-text-weak">
                      {language.t("session.new.project.select")}
                    </div>
                    <div class="flex max-h-80 flex-col overflow-auto">
                      <For each={projects()}>
                        {(project) => {
                          const active = () => project.worktree === projectRoot()
                          return (
                            <DropdownMenu.Item
                              class="rounded-xl px-0.5 py-0"
                              onSelect={() => openProject(project.worktree)}
                            >
                              <div class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left hover:bg-surface-base-hover">
                                <Icon name="folder" size="small" class="shrink-0 text-icon-base" />
                                <span class="min-w-0 flex-1 truncate text-14-medium text-text-strong">
                                  {project.name || getFilename(project.worktree)}
                                </span>
                                <Show when={active()}>
                                  <Icon name="check" size="small" class="shrink-0 text-icon-base" />
                                </Show>
                              </div>
                            </DropdownMenu.Item>
                          )
                        }}
                      </For>
                    </div>
                    <DropdownMenu.Separator class="my-2" />
                    <DropdownMenu.Item class="rounded-xl px-0.5 py-0" onSelect={pickProject}>
                      <div class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left hover:bg-surface-base-hover">
                        <Icon name="folder-add-left" size="small" class="shrink-0 text-icon-base" />
                        <span class="min-w-0 flex-1 text-14-medium text-text-strong">
                          {language.t("session.new.project.add")}
                        </span>
                      </div>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu>
            </div>
            <div class="flex items-start justify-center gap-1.5 min-h-5">
              <Icon name="branch" size="small" class="mt-0.5 shrink-0 text-text-weaker" />
              <div class="text-12-medium text-text-weak select-text leading-5 min-w-0 max-w-160 text-center">
                {label(current())}
              </div>
            </div>
            <Show when={sync.project}>
              {(project) => (
                <div class="flex items-start justify-center gap-3 min-h-5">
                  <div class="text-12-medium text-text-weak leading-5 min-w-0 max-w-160 text-center">
                    {language.t("session.new.lastModified")}&nbsp;
                    <span class="text-text-strong">
                      {DateTime.fromMillis(project().time.updated ?? project().time.created)
                        .setLocale(language.intl())
                        .toRelative()}
                    </span>
                  </div>
                </div>
              )}
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}
