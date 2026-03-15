import { Button } from "@opencode-ai/ui/button"
import { Dialog } from "@opencode-ai/ui/dialog"
import { TextField } from "@opencode-ai/ui/text-field"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { createStore, produce } from "solid-js/store"
import { Session } from "@opencode-ai/sdk/v2/client"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"
import { useLanguage } from "@/context/language"
import { Binary } from "@opencode-ai/util/binary"

export function DialogEditThread(props: { session: Session }) {
  const dialog = useDialog()
  const globalSDK = useGlobalSDK()
  const globalSync = useGlobalSync()
  const language = useLanguage()

  const [state, setState] = createStore({
    title: props.session.title ?? "",
    saving: false,
  })

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    const trimmed = state.title.trim()
    if (trimmed === props.session.title) {
      dialog.close()
      return
    }
    setState("saving", true)
    try {
      await globalSDK.client.session.update({
        directory: props.session.directory,
        sessionID: props.session.id,
        title: trimmed || undefined,
      })
      const [store, setStore] = globalSync.child(props.session.directory, { bootstrap: false })
      setStore(
        "session",
        produce((draft) => {
          const match = Binary.search(draft, props.session.id, (item) => item.id)
          if (match.found) {
            draft[match.index].title = trimmed || language.t("command.session.new")
          }
        }),
      )
    } finally {
      setState("saving", false)
      dialog.close()
    }
  }

  return (
    <Dialog title={language.t("common.rename")}>
      <form class="flex flex-col gap-4 p-6 pt-0" onSubmit={handleSubmit}>
        <TextField
          autofocus
          type="text"
          label={language.t("common.name")}
          value={state.title}
          onChange={(value) => setState("title", value)}
        />
        <div class="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => dialog.close()}>
            {language.t("common.cancel")}
          </Button>
          <Button type="submit" disabled={state.saving}>
            {language.t("common.save")}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
