import { Button } from "@opencode-ai/ui/button"
import { TextField } from "@opencode-ai/ui/text-field"
import { Select } from "@opencode-ai/ui/select"
import { showToast } from "@opencode-ai/ui/toast"
import { createResource, createSignal, type Component, type JSX } from "solid-js"
import { createStore } from "solid-js/store"
import { useGlobalSDK } from "@/context/global-sdk"
import { useLanguage } from "@/context/language"
import { SettingsList } from "./settings-list"

const personas = [
  {
    value: "balanced",
    label: "Balanced",
    text: ["Be pragmatic, clear, and collaborative.", "Balance speed with rigor.", "Prefer direct language."].join("\n"),
  },
  {
    value: "concise",
    label: "Concise",
    text: ["Keep answers brief and high signal.", "Avoid filler.", "Prefer short, direct wording."].join("\n"),
  },
  {
    value: "reviewer",
    label: "Code reviewer",
    text: ["Prioritize bugs, regressions, risks, and missing tests.", "Lead with findings before summaries."].join(
      "\n",
    ),
  },
  {
    value: "teacher",
    label: "Teacher",
    text: ["Explain tradeoffs clearly.", "Show reasoning when it helps the user make a decision."].join("\n"),
  },
  {
    value: "product",
    label: "Product-minded",
    text: ["Favor user-visible improvements.", "Keep solutions simple and easy to extend."].join("\n"),
  },
]

const presets = [
  {
    value: "general",
    label: "General coding",
    text: ["Read files before changing them.", "Preserve existing behavior unless the user asked for a change."].join(
      "\n",
    ),
  },
  {
    value: "planning",
    label: "Planning",
    text: ["Break larger tasks into concrete steps.", "Call out assumptions and blockers early."].join("\n"),
  },
  {
    value: "review",
    label: "Code review",
    text: ["Focus on correctness, safety, maintainability, and test coverage.", "Be explicit about residual risks."].join(
      "\n",
    ),
  },
  {
    value: "debug",
    label: "Debugging",
    text: ["Reproduce before fixing when possible.", "Prefer the smallest fix that explains the failure."].join("\n"),
  },
  {
    value: "ui",
    label: "UI polish",
    text: ["Keep changes aligned with the existing design system.", "Optimize for visible quality and usability."].join(
      "\n",
    ),
  },
]

function template(persona: string, preset: string) {
  const tone = personas.find((item) => item.value === persona)?.text ?? personas[0].text
  const focus = presets.find((item) => item.value === preset)?.text ?? presets[0].text
  return [
    "# Assistant Instructions",
    "",
    "## Personality",
    tone,
    "",
    "## Working Style",
    focus,
    "",
    "## Project Notes",
    "- Add project-specific instructions here.",
    "",
  ].join("\n")
}

export const SettingsAssistant: Component = () => {
  const sdk = useGlobalSDK()
  const language = useLanguage()
  const [saving, setSaving] = createSignal(false)
  const [store, setStore] = createStore({
    persona: personas[0].value,
    preset: presets[0].value,
    content: "",
  })

  const [, actions] = createResource(async () => {
    const result = await sdk.client.app.instructions({}, { throwOnError: true })
    const data = result.data ?? { path: "", content: "" }
    setStore("content", data.content)
    return data
  })

  const save = async () => {
    setSaving(true)
    await sdk.client.app
      .saveInstructions({ content: store.content }, { throwOnError: true })
      .then((result) => {
        const data = result.data ?? { path: "", content: store.content }
        setStore("content", data.content)
        actions.mutate(data)
        showToast({
          variant: "success",
          icon: "circle-check",
          title: "Instructions saved",
          description: "Global AGENTS.md has been updated.",
        })
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        showToast({ title: language.t("common.requestFailed"), description: message })
      })
      .finally(() => setSaving(false))
  }

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,var(--surface-stronger-non-alpha)_calc(100%_-_24px),transparent)]">
        <div class="flex flex-col gap-2 pt-6 pb-8 max-w-[720px]">
          <h2 class="text-16-medium text-text-strong">Custom instructions</h2>
          <p class="text-13-regular text-text-weak">
            Set global custom instructions for the assistant. These apply automatically across the app after you save.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-8 max-w-[720px]">
        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">Presets</h3>
          <SettingsList>
            <div class="flex flex-col gap-4 py-4">
              <div class="grid gap-4 sm:grid-cols-2">
                <TextBlock label="Personality">
                  <Select
                    options={personas}
                    current={personas.find((item) => item.value === store.persona)}
                    value={(item) => item.value}
                    label={(item) => item.label}
                    onSelect={(item) => item && setStore("persona", item.value)}
                    variant="secondary"
                    size="small"
                    triggerVariant="settings"
                  />
                </TextBlock>
                <TextBlock label="Preset">
                  <Select
                    options={presets}
                    current={presets.find((item) => item.value === store.preset)}
                    value={(item) => item.value}
                    label={(item) => item.label}
                    onSelect={(item) => item && setStore("preset", item.value)}
                    variant="secondary"
                    size="small"
                    triggerVariant="settings"
                  />
                </TextBlock>
              </div>
              <div class="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setStore("content", template(store.persona, store.preset))}>
                  Use preset
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStore("content", `${store.content.trim()}\n\n${template(store.persona, store.preset)}`.trim())}
                >
                  Append preset
                </Button>
              </div>
            </div>
          </SettingsList>
        </div>

        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">Global custom instructions</h3>
          <SettingsList>
            <div class="flex flex-col gap-4 py-4">
              <TextField
                label="Instructions"
                multiline
                value={store.content}
                onChange={(value) => setStore("content", value)}
                description="Write the global instructions you want the assistant to follow."
                class="min-h-64"
              />
              <div class="flex flex-wrap gap-3">
                <Button onClick={() => void save()} loading={saving()}>
                  Save instructions
                </Button>
                <Button variant="ghost" onClick={() => void actions.refetch()}>
                  Reload
                </Button>
              </div>
            </div>
          </SettingsList>
        </div>

        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">Actual system prompt</h3>
          <SettingsList>
            <div class="flex flex-col gap-3 py-4 text-13-regular text-text-weak">
              <p>
                This screen is the global custom-instructions editor. You do not need to create or manage files
                yourself.
              </p>
              <p>
                To change the built-in prompt templates themselves, edit the prompt files in the repository under{" "}
                <code>packages/opencode/src/session/prompt/</code> and the provider/system prompt logic in{" "}
                <code>packages/opencode/src/session/system.ts</code> and{" "}
                <code>packages/opencode/src/session/llm.ts</code>.
              </p>
            </div>
          </SettingsList>
        </div>
      </div>
    </div>
  )
}

const TextBlock: Component<{ label: string; children: JSX.Element }> = (props) => {
  return (
    <div class="flex flex-col gap-2">
      <span class="text-13-medium text-text-strong">{props.label}</span>
      {props.children}
    </div>
  )
}
