import { Button } from "@opencode-ai/ui/button"
import { Select } from "@opencode-ai/ui/select"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { useNavigate } from "@solidjs/router"
import { type Component } from "solid-js"
import { useSettings } from "@/context/settings"
import { SettingsList } from "./settings-list"

const ranking: {
  value: "balanced" | "skills-first" | "commands-first"
  label: string
  description: string
}[] = [
  {
    value: "balanced",
    label: "Balanced",
    description: "Mix skills with other slash commands.",
  },
  {
    value: "skills-first",
    label: "Skills first",
    description: "Show skills before other slash commands.",
  },
  {
    value: "commands-first",
    label: "Commands first",
    description: "Show built-in commands before skills.",
  },
]

export const SettingsSkills: Component = () => {
  const settings = useSettings()
  const navigate = useNavigate()
  const dialog = useDialog()

  const openLibrary = () => {
    dialog.close()
    navigate("/skills")
  }

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,var(--surface-stronger-non-alpha)_calc(100%_-_24px),transparent)]">
        <div class="flex flex-col gap-2 pt-6 pb-8 max-w-[720px]">
          <h2 class="text-16-medium text-text-strong">Skills settings</h2>
          <p class="text-13-regular text-text-weak">
            Configure how skills appear and behave in the app. Use the Skills page to browse, read, and manage the
            actual skills.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-8 max-w-[720px]">
        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">Library</h3>
          <SettingsList>
            <div class="flex flex-col gap-4 py-4">
              <p class="text-13-regular text-text-weak">
                Open the dedicated Skills page to browse the full library, inspect skill details, and manage skill
                content.
              </p>
              <div>
                <Button onClick={openLibrary}>Open skills page</Button>
              </div>
            </div>
          </SettingsList>
        </div>

        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">Slash menu</h3>
          <SettingsList>
            <div class="flex flex-col gap-4 py-4">
              <ToggleRow
                title="Show skills in slash menu"
                description="Include skills when typing / in the chat input."
                value={settings.skills.slash()}
                onChange={settings.skills.setSlash}
              />
              <div class="grid gap-2">
                <div class="text-13-medium text-text-strong">Slash ordering</div>
                <Select
                  options={ranking}
                  current={ranking.find((item) => item.value === settings.skills.ranking())}
                  value={(item: (typeof ranking)[number]) => item.value}
                  label={(item: (typeof ranking)[number]) => item.label}
                  onSelect={(item: (typeof ranking)[number] | undefined) => item && settings.skills.setRanking(item.value)}
                  description={(item: (typeof ranking)[number]) => item.description}
                  variant="secondary"
                  size="small"
                  triggerVariant="settings"
                />
              </div>
            </div>
          </SettingsList>
        </div>

        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">Composer behavior</h3>
          <SettingsList>
            <div class="flex flex-col gap-4 py-4">
              <ToggleRow
                title="Show selected skills as chips"
                description="Display selected slash skills as inline pills in the composer instead of plain text."
                value={settings.skills.pills()}
                onChange={settings.skills.setPills}
              />
              <ToggleRow
                title="Auto-convert exact skill commands"
                description="Automatically convert an exact /skill-name command into a skill chip while typing."
                value={settings.skills.autoConvert()}
                onChange={settings.skills.setAutoConvert}
              />
            </div>
          </SettingsList>
        </div>
      </div>
    </div>
  )
}

function ToggleRow(props: {
  title: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label class="flex items-start justify-between gap-4 rounded-lg border border-border-weak-base px-4 py-3 cursor-pointer">
      <div class="min-w-0">
        <div class="text-13-medium text-text-strong">{props.title}</div>
        <div class="pt-1 text-12-regular text-text-weak">{props.description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={props.value}
        class="relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors"
        classList={{
          "bg-interactive-base": props.value,
          "bg-surface-panel": !props.value,
        }}
        onClick={(event) => {
          event.preventDefault()
          props.onChange(!props.value)
        }}
      >
        <span
          class="absolute top-0.5 size-5 rounded-full bg-white transition-transform"
          classList={{
            "translate-x-5": props.value,
            "translate-x-0.5": !props.value,
          }}
        />
      </button>
    </label>
  )
}
