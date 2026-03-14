import { DragDropProvider, DragDropSensors, DragOverlay, SortableProvider, closestCenter, createSortable } from "@thisbeyond/solid-dnd"
import type { DragEvent } from "@thisbeyond/solid-dnd"
import { For, Show, createMemo, createSignal } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { DockTray } from "@opencode-ai/ui/dock-surface"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { useLanguage } from "@/context/language"
import { getTabReorderIndex } from "@/pages/session/helpers"
import { ConstrainDragYAxis, getDraggableId } from "@/utils/solid-dnd"

function Row(props: {
  id: string
  text: string
  multiple: boolean
  busy?: boolean
  onSend: () => void
  onEdit: () => void
  onRemove: () => void
  onDisableQueue: () => void
}) {
  const language = useLanguage()
  const sortable = createSortable(props.id)

  return (
    <div
      use:sortable
      class="group flex items-center gap-2 rounded-[18px] px-2 py-2"
      classList={{ "opacity-50": sortable.isActiveDraggable }}
      style={{
        background: "color-mix(in oklab, var(--background-base) 92%, var(--surface-raised-base))",
        border: "1px solid var(--border-weaker-base)",
      }}
    >
      <Show when={props.multiple}>
        <button
          type="button"
          class="shrink-0 h-8 w-7 rounded-full text-text-weaker hover:text-text-strong cursor-grab active:cursor-grabbing"
          aria-label={language.t("session.followupDock.reorder")}
        >
          <Icon name="chevron-grabber-vertical" size="small" />
        </button>
      </Show>
      <div class="min-w-0 flex-1 text-[15px] leading-6 text-text-strong break-words">{props.text}</div>
      <div class="ml-auto flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="secondary"
          class="h-10 rounded-full px-4 text-15-medium border-0"
          disabled={props.busy}
          onMouseDown={(event: MouseEvent) => event.stopPropagation()}
          onClick={props.onSend}
        >
          {language.t("settings.general.row.followup.option.steer")}
        </Button>
        <IconButton
          type="button"
          icon="trash"
          variant="ghost"
          class="h-10 w-10 rounded-full"
          disabled={props.busy}
          onMouseDown={(event: MouseEvent) => event.stopPropagation()}
          onClick={props.onRemove}
          aria-label={language.t("common.delete")}
        />
        <DropdownMenu>
          <DropdownMenu.Trigger
            as={IconButton}
            icon="menu"
            variant="ghost"
            class="h-10 w-10 rounded-full text-text-weak"
            aria-label={language.t("common.moreOptions")}
            disabled={props.busy}
            onMouseDown={(event: MouseEvent) => event.stopPropagation()}
          />
          <DropdownMenu.Portal>
            <DropdownMenu.Content class="min-w-56 rounded-[22px] border border-border-weak-base bg-background-base shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
              <DropdownMenu.Item onSelect={props.onEdit}>
                <Icon name="edit" class="w-4 h-4 mr-2" />
                <DropdownMenu.ItemLabel>{language.t("session.followupDock.editMessage")}</DropdownMenu.ItemLabel>
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={props.onDisableQueue}>
                <Icon name="menu" class="w-4 h-4 mr-2" />
                <DropdownMenu.ItemLabel>{language.t("session.followupDock.disableQueue")}</DropdownMenu.ItemLabel>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function SessionFollowupDock(props: {
  items: { id: string; text: string }[]
  sending?: string
  onSend: (id: string) => void
  onEdit: (id: string) => void
  onRemove: (id: string) => void
  onMove: (from: string, to: string) => void
  onDisableQueue: () => void
}) {
  const language = useLanguage()
  const [active, setActive] = createSignal<string>()
  const ids = createMemo(() => props.items.map((item) => item.id))
  const multiple = createMemo(() => props.items.length > 1)
  const activeItem = createMemo(() => props.items.find((item) => item.id === active()))

  const handleDragStart = (event: unknown) => {
    setActive(getDraggableId(event))
  }

  const handleDragOver = (event: DragEvent) => {
    if (props.sending) return
    const { draggable, droppable } = event
    if (!draggable || !droppable) return
    const from = draggable.id.toString()
    const to = droppable.id.toString()
    if (from === to) return
    if (getTabReorderIndex(ids(), from, to) === undefined) return
    props.onMove(from, to)
  }

  const handleDragEnd = () => {
    setActive(undefined)
  }

  return (
    <DockTray
      data-component="session-followup-dock"
      class="border-t border-border-weaker-base bg-background-base/96"
      style={{
        "margin-bottom": "-0.875rem",
        "border-bottom-left-radius": 0,
        "border-bottom-right-radius": 0,
      }}
    >
      <div class="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <div class="text-12-medium text-text-weak tracking-[0.01em]">
          {language.t(
            props.items.length === 1 ? "session.followupDock.summary.one" : "session.followupDock.summary.other",
            { count: props.items.length },
          )}
        </div>
      </div>
      <DragDropProvider onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} collisionDetector={closestCenter}>
        <DragDropSensors />
        <ConstrainDragYAxis />
        <div class="px-4 pb-3 flex flex-col gap-2 max-h-56 overflow-y-auto no-scrollbar">
          <SortableProvider ids={ids()}>
            <For each={props.items}>
              {(item) => (
                <Row
                  id={item.id}
                  text={item.text}
                  multiple={multiple()}
                  busy={!!props.sending}
                  onSend={() => props.onSend(item.id)}
                  onEdit={() => props.onEdit(item.id)}
                  onRemove={() => props.onRemove(item.id)}
                  onDisableQueue={props.onDisableQueue}
                />
              )}
            </For>
          </SortableProvider>
        </div>
        <DragOverlay>
          <Show when={activeItem()}>
            {(item) => (
              <div class="max-w-[720px] rounded-[18px] border border-border-weak-base bg-background-base px-3 py-2 shadow-lg text-15-medium text-text-strong">
                {item().text}
              </div>
            )}
          </Show>
        </DragOverlay>
      </DragDropProvider>
    </DockTray>
  )
}
