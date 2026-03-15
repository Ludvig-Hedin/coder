import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon } from "@opencode-ai/ui/icon"
import { Select } from "@opencode-ai/ui/select"
import { TextField } from "@opencode-ai/ui/text-field"
import { createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import { getFilename } from "@opencode-ai/util/path"
import { useGlobalSync } from "@/context/global-sync"
import { useLanguage } from "@/context/language"

const sources = ["Local"] as const
const plans = ["Daily at 9:00 AM", "Weekdays at 9:00 AM", "Every hour"] as const
const models = ["GPT-5.4", "GPT-5", "o4-mini"] as const
const fallback = ["coder", "personal", "mail"] as const

export function DialogAutomation(props: { onCreate: (input: { title: string; prompt: string; project: string }) => void }) {
  const dialog = useDialog()
  const sync = useGlobalSync()
  const language = useLanguage()
  const opts = createMemo(() => {
    const list = sync.data.project.map((item) => item.name || getFilename(item.worktree)).filter(Boolean)
    return [...new Set(list)].slice(0, 6)
  })
  const dirs = createMemo(() => (opts().length ? opts() : [...fallback]))
  const [store, setStore] = createStore({
    title: "",
    prompt: "",
    project: dirs()[0] ?? "coder",
    source: sources[0],
    plan: plans[0] as string,
    model: models[0] as string,
    full: false,
  })

  const ready = createMemo(() => !!store.title.trim() || !!store.prompt.trim())

  const submit = (event: SubmitEvent) => {
    event.preventDefault()
    if (!ready()) return
    props.onCreate({
      title: store.title,
      prompt: store.prompt,
      project: store.project,
    })
    dialog.close()
  }

  const useTemplate = () =>
    setStore({
      title: language.t("automations.dialog.template.title"),
      prompt: language.t("automations.dialog.template.prompt"),
      project: dirs()[0] ?? "coder",
      source: sources[0],
      plan: plans[0],
      model: models[0],
    })

  return (
    <Dialog
      fit
      transition
      containerClass={store.full ? "automation-dialog__container automation-dialog__container--full" : "automation-dialog__container"}
      class="automation-dialog"
    >
      <form class="automation-dialog__form" onSubmit={submit}>
        <div class="automation-dialog__head">
          <TextField
            autofocus
            class="automation-dialog__title-input"
            hideLabel
            label={language.t("automations.dialog.titleLabel")}
            placeholder={language.t("automations.dialog.titlePlaceholder")}
            value={store.title}
            onChange={(value) => setStore("title", value)}
          />
          <div class="automation-dialog__actions">
            <Button
              type="button"
              size="large"
              variant="ghost"
              class="automation-dialog__expand"
              onClick={() => setStore("full", (value) => !value)}
            >
              <Icon name={store.full ? "collapse" : "expand"} size="small" />
              {language.t("automations.dialog.expand")}
            </Button>
            <Button
              type="button"
              size="large"
              variant="secondary"
              class="automation-dialog__template"
              onClick={useTemplate}
            >
              {language.t("automations.dialog.template.action")}
            </Button>
          </div>
        </div>

        <div class="automation-dialog__body">
          <TextField
            multiline
            hideLabel
            label={language.t("automations.dialog.promptLabel")}
            class="automation-dialog__prompt-input"
            placeholder={language.t("automations.dialog.promptPlaceholder")}
            value={store.prompt}
            onChange={(value) => setStore("prompt", value)}
            autoResize={false}
          />
        </div>

        <div class="automation-dialog__footer">
          <div class="automation-dialog__toolbar">
            <Select
              options={[...sources]}
              current={store.source}
              onSelect={(value) => value && setStore("source", value)}
              variant="ghost"
              size="large"
              class="automation-dialog__chip automation-dialog__select"
            >
              {(item) => (
                <div class="flex min-w-0 items-center gap-2">
                  <Icon name="console" size="small" />
                  <span class="truncate">{item}</span>
                </div>
              )}
            </Select>
            <Select
              options={[...dirs()]}
              current={store.project}
              onSelect={(value) => value && setStore("project", value)}
              variant="ghost"
              size="large"
              class="automation-dialog__chip automation-dialog__select"
            >
              {(item) => (
                <div class="flex min-w-0 items-center gap-2">
                  <Icon name="folder" size="small" />
                  <span class="truncate">{item}</span>
                </div>
              )}
            </Select>
            <Select
              options={[...plans]}
              current={store.plan}
              onSelect={(value) => value && setStore("plan", value)}
              variant="ghost"
              size="large"
              class="automation-dialog__chip automation-dialog__select"
            >
              {(item) => (
                <div class="flex min-w-0 items-center gap-2">
                  <Icon name="new-session" size="small" />
                  <span class="truncate">{item}</span>
                </div>
              )}
            </Select>
            <Select
              options={[...models]}
              current={store.model}
              onSelect={(value) => value && setStore("model", value)}
              variant="ghost"
              size="large"
              class="automation-dialog__chip automation-dialog__select"
            >
              {(item) => (
                <div class="flex min-w-0 items-center gap-2">
                  <Icon name="models" size="small" />
                  <span class="truncate">{item}</span>
                </div>
              )}
            </Select>
          </div>

          <div class="automation-dialog__submit">
            <Button type="button" variant="ghost" size="large" class="automation-dialog__cancel" onClick={() => dialog.close()}>
              {language.t("common.cancel")}
            </Button>
            <Button type="submit" size="large" disabled={!ready()} class="automation-dialog__create">
              {language.t("automations.dialog.create")}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
