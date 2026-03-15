import { Component, For, Show, splitProps, type JSX } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { FileIcon } from "@opencode-ai/ui/file-icon"
import type { ImageAttachmentPart } from "@/context/prompt"

type PromptImageAttachmentsProps = JSX.HTMLAttributes<HTMLDivElement> & {
  attachments: ImageAttachmentPart[]
  onOpen: (attachment: ImageAttachmentPart) => void
  onRemove: (id: string) => void
  removeLabel: string
}

export const PromptImageAttachments: Component<PromptImageAttachmentsProps> = (props) => {
  const [local, others] = splitProps(props, [
    "attachments",
    "onOpen",
    "onRemove",
    "removeLabel",
    "class",
    "classList",
    "style",
  ])

  return (
    <Show when={local.attachments.length > 0}>
      <div
        {...others}
        class={`flex flex-wrap gap-2 ${local.class ?? ""}`}
        classList={local.classList}
        style={local.style}
      >
        <For each={local.attachments}>
          {(attachment) => {
            const isImage = attachment.mime.startsWith("image/")
            return (
              <div
                class="group relative flex min-w-[150px] max-w-full items-center gap-3 rounded-full border border-border-weak-base bg-surface-base px-3 py-1.5 text-12-regular text-text-weak shadow-[0_0_0_1px_var(--border-weak-base)] transition hover:border-border-strong hover:text-text-strong cursor-pointer"
                title={attachment.filename}
                onClick={() => isImage && local.onOpen(attachment)}
              >
                <div class="size-8 overflow-hidden rounded-full border border-border-weak-base/40 bg-surface-base shadow-inner">
                  <Show
                    when={isImage}
                    fallback={
                      <div class="size-8 flex items-center justify-center text-icon-weak">
                        <FileIcon node={{ path: attachment.filename ?? "", type: "file" }} />
                      </div>
                    }
                  >
                    <img
                      src={attachment.dataUrl}
                      alt={attachment.filename}
                      class="size-8 object-cover"
                      loading="lazy"
                    />
                  </Show>
                </div>
                <span class="truncate text-12-regular text-text-strong">{attachment.filename}</span>
                <button
                  type="button"
                  class="absolute -top-2 -right-2 size-6 rounded-full bg-surface-raised-stronger border border-border-weak-base flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-surface-raised-strong-hover focus-visible:opacity-100"
                  aria-label={local.removeLabel}
                  onClick={(event) => {
                    event.stopPropagation()
                    local.onRemove(attachment.id)
                  }}
                >
                  <Icon name="close" class="size-3 text-text-weak" />
                </button>
              </div>
            )
          }}
        </For>
      </div>
    </Show>
  )
}
