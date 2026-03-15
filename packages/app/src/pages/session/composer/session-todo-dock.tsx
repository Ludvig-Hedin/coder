import type { Todo } from "@opencode-ai/sdk/v2"
import { DockTray } from "@opencode-ai/ui/dock-surface"
import { Icon } from "@opencode-ai/ui/icon"
import { Index, Show, createEffect, createMemo, onCleanup } from "solid-js"
import { composerEnabled, composerProbe } from "@/testing/session-composer"

function ring(status: Todo["status"]) {
  if (status === "completed") {
    return <div class="mt-1.5 size-3.5 rounded-full border border-border-strong bg-text-strong" />
  }
  if (status === "in_progress") {
    return <div class="mt-1.5 size-3.5 rounded-full border border-text-strong bg-transparent shadow-[0_0_0_2px_rgba(255,255,255,0.06)_inset]" />
  }
  return <div class="mt-1.5 size-3.5 rounded-full border border-border-strong bg-transparent" />
}

export function SessionTodoDock(props: {
  sessionID?: string
  todos: Todo[]
  collapseLabel: string
  expandLabel: string
  dockProgress: number
}) {
  const e2e = composerEnabled()
  const probe = composerProbe(props.sessionID)
  const total = createMemo(() => props.todos.length)
  const done = createMemo(() => props.todos.filter((todo) => todo.status === "completed").length)
  const title = createMemo(() => `${done()} out of ${total()} tasks completed`)

  createEffect(() => {
    if (!e2e) return
    probe.set({
      mounted: true,
      collapsed: false,
      hidden: props.todos.length === 0,
      count: props.todos.length,
      states: props.todos.map((todo) => todo.status),
    })
  })

  onCleanup(() => {
    if (!e2e) return
    probe.drop()
  })

  return (
    <Show when={props.todos.length > 0}>
      <DockTray
        data-component="session-todo-dock"
        class="overflow-hidden rounded-[30px] border border-border-weak bg-[#2b2b2b] shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]"
        style={{
          opacity: `${Math.max(0, Math.min(1, props.dockProgress || 1))}`,
        }}
      >
        <div class="border-b border-border-weak/70 px-4 py-3 flex items-center gap-3">
          <Icon name="checklist" size="small" class="text-text-weak" />
          <div class="min-w-0 flex-1 text-[15px] font-medium leading-6 text-text-weak">{title()}</div>
          <button
            type="button"
            class="rounded-full p-1 text-text-weak transition-colors hover:text-text-strong"
            aria-label={props.collapseLabel}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M10.5 5.5h-5v5" />
              <path d="M10.5 10.5 5.5 5.5" />
            </svg>
          </button>
        </div>
        <div class="px-5 py-4">
          <div class="flex flex-col gap-4">
            <Index each={props.todos}>
              {(todo, i) => (
                <div class="flex items-start gap-4">
                  <div class="pt-0.5 text-text-strong/90">{ring(todo().status)}</div>
                  <div class="min-w-0 flex-1">
                    <div
                      classList={{
                        "text-[16px] leading-8 text-text-strong": true,
                        "opacity-65 line-through": todo().status === "completed" || todo().status === "cancelled",
                        "opacity-80": todo().status === "pending",
                      }}
                    >
                      {i + 1}. {todo().content}
                    </div>
                  </div>
                </div>
              )}
            </Index>
          </div>
        </div>
      </DockTray>
    </Show>
  )
}
