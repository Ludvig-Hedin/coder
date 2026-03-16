import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon, type IconName } from "@opencode-ai/ui/icon"
import { TextField } from "@opencode-ai/ui/text-field"
import { createMemo, createSignal, For } from "solid-js"
import { useLanguage } from "@/context/language"

// Target: what the review should diff against
type Target =
  | { type: "uncommitted"; label: string; arg: string }
  | { type: "staged"; label: string; arg: string }
  | { type: "branch"; label: string; arg: string }
  | { type: "commit"; label: string; arg: string }
  | { type: "pr"; label: string; arg: string }

// Fix mode: how the agent handles suggested changes
export type FixMode = "manual" | "auto" | "agent"

const TARGETS: Target[] = [
  { type: "uncommitted", label: "Uncommitted changes", arg: "" },
  { type: "staged", label: "Staged changes only", arg: "staged" },
  { type: "branch", label: "vs dev branch", arg: "dev" },
  { type: "commit", label: "Specific commit or branch…", arg: "" },
  { type: "pr", label: "Pull request…", arg: "" },
]

const FIX_MODES: { mode: FixMode; label: string; description: string; icon: IconName }[] = [
  {
    mode: "manual",
    label: "Manual",
    description: "Suggestions only — you apply fixes",
    icon: "eye",
  },
  {
    mode: "auto",
    label: "Auto-fix",
    description: "Apply safe, style-level patches automatically",
    icon: "check",
  },
  {
    mode: "agent",
    label: "Agent decides",
    description: "Agent applies verified fixes, asks for the rest",
    icon: "brain",
  },
]

export function DialogReview(props: {
  onRun: (args: string, mode: FixMode) => void
}) {
  const dialog = useDialog()
  const language = useLanguage()

  const [selected, setSelected] = createSignal<Target>(TARGETS[0])
  const [mode, setMode] = createSignal<FixMode>("manual")
  const [custom, setCustom] = createSignal("")

  // Build the $ARGUMENTS string passed to the /review command template
  const reviewArgs = createMemo(() => {
    const t = selected()
    if (t.type === "uncommitted") return ""
    if (t.type === "staged") return "staged"
    if (t.type === "branch") return t.arg
    // custom input types (commit / pr) use the text field
    return custom().trim()
  })

  function submit(e: SubmitEvent) {
    e.preventDefault()
    props.onRun(reviewArgs(), mode())
    dialog.close()
  }

  return (
    <Dialog title={language.t("dialog.review.title")} class="w-full max-w-[460px] mx-auto">
      <form onSubmit={submit} class="flex flex-col gap-5 p-6 pt-0">

        {/* Target selection */}
        <div class="flex flex-col gap-2">
          <span class="text-12-medium text-text-weak">{language.t("dialog.review.target.label")}</span>
          <div class="flex flex-col gap-1">
            <For each={TARGETS}>
              {(t) => (
                <button
                  type="button"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-13-regular text-left transition-colors"
                  classList={{
                    "bg-surface-raised-base text-text-strong": selected().type === t.type,
                    "text-text-weak hover:bg-surface-base-hover": selected().type !== t.type,
                  }}
                  onClick={() => setSelected(t)}
                >
                  <div
                    class="size-3.5 rounded-full border-2 shrink-0 transition-colors"
                    classList={{
                      "border-text-interactive-base bg-text-interactive-base": selected().type === t.type,
                      "border-border-base": selected().type !== t.type,
                    }}
                  />
                  {t.label}
                </button>
              )}
            </For>
          </div>

          {/* Custom input shown for commit / pr targets */}
          {(selected().type === "commit" || selected().type === "pr") && (
            <TextField
              autofocus
              type="text"
              placeholder={
                selected().type === "pr"
                  ? language.t("dialog.review.target.pr.placeholder")
                  : language.t("dialog.review.target.commit.placeholder")
              }
              value={custom()}
              onChange={setCustom}
            />
          )}
        </div>

        {/* Fix mode selection */}
        <div class="flex flex-col gap-2">
          <span class="text-12-medium text-text-weak">{language.t("dialog.review.mode.label")}</span>
          <div class="flex gap-2">
            <For each={FIX_MODES}>
              {(m) => (
                <button
                  type="button"
                  class="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors"
                  classList={{
                    "border-text-interactive-base bg-surface-info-base/10 text-text-strong": mode() === m.mode,
                    "border-border-base text-text-weak hover:bg-surface-base-hover": mode() !== m.mode,
                  }}
                  onClick={() => setMode(m.mode)}
                >
                  <Icon name={m.icon} size="medium" />
                  <span class="text-11-medium">{m.label}</span>
                  <span class="text-11-regular text-text-weaker text-center leading-tight">{m.description}</span>
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="large" onClick={() => dialog.close()}>
            {language.t("common.cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="large"
            // require non-empty custom input when a custom target is selected
            disabled={(selected().type === "commit" || selected().type === "pr") && !custom().trim()}
          >
            <Icon name="review" size="small" />
            {language.t("dialog.review.run")}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
