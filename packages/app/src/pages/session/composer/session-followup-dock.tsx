import { DragDropProvider, DragDropSensors, DragOverlay, SortableProvider, closestCenter, createSortable } from "@thisbeyond/solid-dnd"
import type { DragEvent } from "@thisbeyond/solid-dnd"
import { Button } from "@opencode-ai/ui/button"
import { DockTray } from "@opencode-ai/ui/dock-surface"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { getDraggableId } from "@/utils/solid-dnd"
import { For, Show, createMemo, createSignal, type JSX } from "solid-js"
import { useLanguage } from "@/context/language"

type Item = { id: string; text: string }

function Handle() {
  return (
    <div class="shrink-0 text-text-weak">
      <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor" aria-hidden="true">
        <circle cx="3" cy="3" r="1" />
        <circle cx="9" cy="3" r="1" />
        <circle cx="3" cy="6" r="1" />
        <circle cx="9" cy="6" r="1" />
        <circle cx="3" cy="9" r="1" />
        <circle cx="9" cy="9" r="1" />
      </svg>
    </div>
  )
}

function QueueIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path d="M3.5 4.5h5" />
      <path d="M3.5 8h7" />
      <path d="M3.5 11.5h4" />
      <path d="m9.5 10.5 2.5 2.5 2.5-2.5" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="8" r="1.1" />
      <circle cx="8" cy="8" r="1.1" />
      <circle cx="13" cy="8" r="1.1" />
    </svg>
  )
}

function Card(props: {
  item: Item
  sending?: string
  onSend: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}) {
  const sortable = createSortable(props.item.id)
  const language = useLanguage()
  const busy = createMemo(() => !!props.sending)

  return (
    <div use:sortable classList={{ "opacity-40": sortable.isActiveDraggable }}>
      <div class="rounded-2xl border border-border-weak bg-surface-base px-3 py-3 shadow-[0_1px_0_rgba(255,255,255,0.02)_inset]">
        <div class="flex items-start gap-3">
          <div class="cursor-grab pt-1 active:cursor-grabbing">
            <Handle />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-start gap-3">
              <div class="min-w-0 flex-1">
                <div class="line-clamp-2 text-14-medium leading-6 text-text-strong">{props.item.text}</div>
              </div>
              <div class="shrink-0">
                <Button
                  size="small"
                  variant="secondary"
                  class="rounded-full px-3"
                  disabled={busy()}
                  onClick={() => props.onSend(props.item.id)}
                >
                  {language.t("session.followupDock.sendNow")}
                </Button>
              </div>
            </div>
            <div class="mt-3 flex items-center justify-end gap-1.5">
              <Button
                size="small"
                variant="ghost"
                class="rounded-full px-3 text-text-weak hover:text-text-strong"
                disabled={busy()}
                onClick={() => props.onEdit(props.item.id)}
              >
                {language.t("session.followupDock.edit")}
              </Button>
              <IconButton
                icon="trash"
                size="small"
                variant="ghost"
                class="rounded-full text-text-weak hover:text-text-strong"
                disabled={busy()}
                onClick={() => props.onDelete(props.item.id)}
                aria-label={language.t("session.followupDock.delete")}
              />
              <Button
                size="small"
                variant="ghost"
                class="rounded-full p-2 text-text-weak hover:text-text-strong"
                aria-label={language.t("common.moreOptions")}
              >
                <MoreIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SessionFollowupDock(props: {
  items: Item[]
  sending?: string
  onSend: (id: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, to: number) => void
  onEdit: (id: string) => void
}) {
  const language = useLanguage()
  const [active, setActive] = createSignal<Item>()
  const total = createMemo(() => props.items.length)
  const label = createMemo(() =>
    language.t(total() === 1 ? "session.followupDock.summary.one" : "session.followupDock.summary.other", {
      count: total(),
    }),
  )

  const drag = (event: DragEvent) => {
    const id = getDraggableId(event)
    if (!id) return
    setActive(props.items.find((item) => item.id === id))
  }

  const drop = (event: DragEvent) => {
    const from = event.draggable?.id?.toString()
    const to = event.droppable?.id?.toString()
    setActive(undefined)
    if (!from || !to || from === to) return
    const toIndex = props.items.findIndex((item) => item.id === to)
    if (toIndex < 0) return
    props.onMove(from, toIndex)
  }

  return (
    <DockTray
      data-component="session-followup-dock"
      class="mb-2 overflow-hidden rounded-[26px] border border-border-weak bg-[#252525]"
    >
      <div class="border-b border-border-weak/80 px-4 py-3 flex items-center gap-3">
        <div class="text-text-weak">
          <QueueIcon />
        </div>
        <div class="min-w-0 flex-1 text-13-medium text-text-weak">{label()}</div>
      </div>
      <DragDropProvider collisionDetector={closestCenter} onDragStart={drag} onDragEnd={drop}>
        <DragDropSensors />
        <SortableProvider ids={props.items.map((item) => item.id)}>
          <div class="flex flex-col gap-2 p-3">
            <For each={props.items}>
              {(item) => (
                <Card
                  item={item}
                  sending={props.sending}
                  onSend={props.onSend}
                  onDelete={props.onDelete}
                  onEdit={props.onEdit}
                />
              )}
            </For>
          </div>
        </SortableProvider>
        <DragOverlay>
          <Show when={active()}>
            {(item) => (
              <div class="w-[min(560px,calc(100vw-64px))] rounded-2xl border border-border-weak bg-surface-base px-3 py-3 shadow-2xl">
                <div class="flex items-start gap-3">
                  <div class="pt-1">
                    <Handle />
                  </div>
                  <div class="line-clamp-2 text-14-medium leading-6 text-text-strong">{item().text}</div>
                </div>
              </div>
            )}
          </Show>
        </DragOverlay>
      </DragDropProvider>
    </DockTray>
  )
}
