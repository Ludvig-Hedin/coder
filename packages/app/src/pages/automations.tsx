import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { createMemo, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { DialogAutomation } from "@/components/dialog-automation"
import { useLanguage } from "@/context/language"
import { appendAutom, seedAutomations } from "./automations-state"

export default function Automations() {
  const dialog = useDialog()
  const language = useLanguage()
  const [store, setStore] = createStore({
    items: seedAutomations(),
  })

  const paused = createMemo(() => store.items.filter((item) => item.status === "paused"))

  const open = () =>
    dialog.show(() => (
      <DialogAutomation
        onCreate={(input) => {
          setStore("items", (list) => appendAutom(list, input))
        }}
      />
    ))

  return (
    <div class="automation-page">
      <div class="automation-page__head">
        <h1 class="automation-page__title">{language.t("automations.title")}</h1>
        <Button size="large" icon="plus-small" class="automation-page__new" onClick={open}>
          {language.t("automations.new")}
        </Button>
      </div>

      <section class="automation-page__section">
        <div class="automation-page__label">{language.t("automations.section.paused")}</div>
        <div class="automation-page__list">
          <For each={paused()}>
            {(item) => (
              <article class="automation-row">
                <div class="automation-row__main">
                  <div class="automation-row__dot" />
                  <div class="min-w-0">
                    <div class="automation-row__line">
                      <span class="automation-row__name">{item.name}</span>
                      <span class="automation-row__project">{item.project}</span>
                    </div>
                    <Show when={item.note}>
                      <div class="automation-row__note">{item.note}</div>
                    </Show>
                  </div>
                </div>
                <div class="automation-row__status">{language.t("automations.status.paused")}</div>
              </article>
            )}
          </For>
        </div>
      </section>
    </div>
  )
}
