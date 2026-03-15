import { Button } from "@opencode-ai/ui/button"
import { TextField } from "@opencode-ai/ui/text-field"
import { showToast } from "@opencode-ai/ui/toast"
import { createMemo, createResource, createSignal, For, type Component, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { SettingsList } from "./settings-list"

type Skill = {
  name: string
  description: string
  location: string
  content: string
}

const templates = [
  {
    name: "beautiful-design",
    title: "Beautiful design",
    description: "Refine an existing UI into a tighter, calmer, product-ready visual design.",
    content: [
      "## Role",
      "",
      "You are a front-end product designer and UI engineer. Your job is to take this existing UI and make it look more refined, minimal, and product-ready without changing the core layout or functionality.",
      "",
      "Design it as if it was featured in a UI design contest and won for excellent UX/UI, strong visual refinement, and delightful product feel.",
      "",
      "Use enough spacing, keep things tight and small.",
      "",
      "Use a restrained, mostly monochrome palette with just a whisper of accent. Apply generous yet purposeful spacing and slightly smaller, well-grouped elements. Favor soft, rounded corners, smooth strokes, and subtle contrast. Avoid harsh lines or screaming colors.",
      "",
      "Follow best UI practices for rhythm, hierarchy, and visual balance to create an elegant, eye-candy interface that wins on both beauty and usability.",
      "",
      "Do not use pure #000000. Prefer slightly lifted blacks.",
      "",
      "## Goals",
      "",
      "- Make the UI feel tighter, cleaner, and more mature.",
      "- Reduce the AI dashboard or chatbot vibe.",
      "- Improve spacing, hierarchy, and visual grouping.",
      "- Make typography feel intentional and compact.",
      "",
      "## Hard constraints",
      "",
      "- No purple background colors.",
      "- Use accent colors very sparingly, mainly for key actions or highlights.",
      "- Prefer neutral backgrounds with subtle contrast between sections.",
      "- Preserve all functional elements and states. Do not delete features; restyle them.",
      "",
      "## Design principles",
      "",
      "- Use a consistent spacing system such as a 4/8px scale for padding, gaps, and section rhythm.",
      "- Tighten text by reducing airy tracking and using slightly lower line-height for dense but readable UI copy.",
      "- Improve visual grouping with spacing, subtle dividers, and light surface shifts instead of heavy borders.",
      "- Avoid large empty areas unless they serve a clear purpose.",
      "- Tone down decoration. Avoid heavy glows, gradients, neon colors, glassmorphism, or generic AI visuals.",
      "- Prefer solid fills, subtle shadows if needed, and clean shapes.",
      "- Keep corner radii consistent across the app.",
      "",
      "## Implementation instructions",
      "",
      "- Refactor existing styles rather than rewriting the full UI from scratch.",
      "- Keep class names and component structure as stable as possible. Focus on tokens and style rules.",
      "- Introduce or refine design tokens if helpful for colors, spacing, radii, and typography.",
      "- For any new color, ensure sufficient contrast and keep the palette small and coherent.",
      "",
      "## Output requirement",
      "",
      "- Include a brief explanation of key visual changes made and why, focusing on spacing, typography, and grouping.",
    ].join("\n"),
  },
  {
    name: "ux-assessment",
    title: "UX assessment",
    description: "Review one app area for clarity, friction, hierarchy, discoverability, and ease of use.",
    content: [
      "## Role",
      "",
      "You are a senior UX designer and product usability expert.",
      "",
      "## Task",
      "",
      "Perform a UX assessment of the following part of the app:",
      "",
      "{AREA OF THE APP}",
      "",
      "## Scope",
      "",
      "Focus on usability for typical users: clarity, intuitiveness, speed of understanding, and ease of use.",
      "",
      "Do not focus on:",
      "",
      "- screen reader accessibility",
      "- disability accessibility compliance",
      "- WCAG rules",
      "- ARIA or assistive technology",
      "",
      "Instead focus on:",
      "",
      "- clarity",
      "- intuitive design",
      "- cognitive load",
      "- friction",
      "- discoverability",
      "- user confidence",
      "- speed of understanding",
      "- interaction flow",
      "",
      "## Phase 1: Understand the area",
      "",
      "First inspect the relevant code.",
      "",
      "Determine:",
      "",
      "- the goal of this area",
      "- the main tasks users perform",
      "- the primary user flow",
      "- the key UI components involved",
      "- what information users must understand",
      "",
      "Write a short Area Overview summarizing:",
      "",
      "- what this part of the app does",
      "- what users are trying to accomplish",
      "- the current interaction flow",
      "",
      "## Phase 2: UX heuristic assessment",
      "",
      "Evaluate the area for clarity, cognitive load, information hierarchy, interaction friction, discoverability, feedback, consistency, and speed of understanding.",
      "",
      "For each issue identify:",
      "",
      "- the problem",
      "- why it creates friction",
      "- the severity: High, Medium, or Low",
      "",
      "## Phase 3: Gap analysis",
      "",
      "For each UX problem provide:",
      "",
      "- Problem",
      "- Why it is confusing or inefficient",
      "- How users might misunderstand it",
      "- Severity level",
      "",
      "Focus especially on unclear actions, hidden functionality, confusing labels, weak hierarchy, and unnecessary complexity.",
      "",
      "## Phase 4: UX improvement suggestions",
      "",
      "For each issue propose specific, implementable improvements such as better labels, improved placement, simplified flows, stronger grouping, clearer hierarchy, better feedback states, fewer steps, or better empty states.",
      "",
      "## Phase 5: Quick wins vs structural improvements",
      "",
      "Separate recommendations into:",
      "",
      "- Quick Wins: small changes with high impact",
      "- Structural Improvements: larger redesigns or flow changes",
      "",
      "## Output format",
      "",
      "Return results in this structure:",
      "",
      "1. Area Overview",
      "2. Current User Flow",
      "3. UX Issues Found",
      "4. Gap Analysis",
      "5. Quick Wins",
      "6. Structural Improvements",
      "7. Summary of Biggest UX Opportunities",
      "",
      "## Goal",
      "",
      "Make the area easier to understand, faster to use, more intuitive, clearer for first-time users, and lower in cognitive load. Focus on practical UX improvements that increase clarity and usability.",
    ].join("\n"),
  },
  {
    name: "code-review",
    title: "Code review",
    description: "Review code from the current session for correctness, safety, maintainability, and gaps.",
    content: [
      "## Role",
      "",
      "Act as a senior software engineer and conscious reviewer.",
      "",
      "## Goal",
      "",
      "Review the code generated in the current session for correctness, safety, maintainability, and best practices.",
      "",
      "## Review steps",
      "",
      "1. Validate correctness and alignment with the original request.",
      "2. Check for safety issues such as insecure code, injection risks, secrets, or unsafe dependencies.",
      "3. Search for errors, edge cases, performance issues, and readability problems.",
      "4. Confirm reliability and note whether tests exist. If missing, suggest the smallest useful tests.",
      "5. Summarize findings and what was validated.",
      "6. State whether the code is safe to approve and why.",
      "",
      "## Restrictions",
      "",
      "- Read the changed code.",
      "- Do not hallucinate files or changes.",
      "- Do not skip the review step.",
      "- Do not recommend shipping if the review does not pass.",
      "",
      "## Output format",
      "",
      "- Section 1: Review Summary",
      "- Section 2: Fixed Code (if changes were made)",
      "- Section 3: GitHub Commit",
      "",
      "In Review Summary, cover correctness, safety, improvements, and testing.",
      "",
      "If findings exist, lead with them in priority order and include file references.",
    ].join("\n"),
  },
]

export const SettingsSkills: Component = () => {
  const sdk = useGlobalSDK()
  const sync = useGlobalSync()
  const language = useLanguage()
  const platform = usePlatform()
  const [saving, setSaving] = createSignal(false)
  const [store, setStore] = createStore({
    name: "",
    description: "",
    content: "",
    location: "",
  })

  const root = createMemo(() => {
    const dir = sync.data.path.config
    return dir ? `${dir}/skills` : ""
  })

  const [skills, actions] = createResource(async () => {
    const result = await sdk.client.app.skills({}, { throwOnError: true })
    return (result.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
  })

  const managed = (item: Skill | undefined) => !!item && item.location.startsWith(root())

  const choose = (item?: Skill) => {
    setStore({
      name: item?.name ?? "",
      description: item?.description ?? "",
      content: item?.content ?? "",
      location: item?.location ?? "",
    })
  }

  const load = (item: (typeof templates)[number]) => {
    setStore({
      name: item.name,
      description: item.description,
      content: item.content,
      location: "",
    })
  }

  const save = async () => {
    setSaving(true)
    await sdk.client.app
      .saveSkill(
        {
          name: store.name.trim(),
          description: store.description.trim(),
          content: store.content,
        },
        { throwOnError: true },
      )
      .then((result) => {
        const item = result.data
        if (item) choose(item)
        showToast({
          variant: "success",
          icon: "circle-check",
          title: "Skill saved",
          description: "The managed skill file has been updated.",
        })
        return actions.refetch()
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
          <h2 class="text-16-medium text-text-strong">Skills</h2>
          <p class="text-13-regular text-text-weak">
            View discovered skills and create or edit managed skills saved under <code>{root()}</code>.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-8 max-w-[720px]">
        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">Built-in templates</h3>
          <SettingsList>
            <For each={templates}>
              {(item) => (
                <div class="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-border-weak-base last:border-none">
                  <div class="min-w-0">
                    <div class="text-14-medium text-text-strong">{item.title}</div>
                    <div class="text-12-regular text-text-weak">{item.description}</div>
                  </div>
                  <Button variant="secondary" onClick={() => load(item)}>
                    Add to editor
                  </Button>
                </div>
              )}
            </For>
          </SettingsList>
        </div>

        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between gap-3 pb-2">
            <h3 class="text-14-medium text-text-strong">Available skills</h3>
            <Button variant="ghost" onClick={() => choose()}>
              New skill
            </Button>
          </div>
          <SettingsList>
            <Show
              when={(skills() ?? []).length > 0}
              fallback={<div class="py-4 text-14-regular text-text-weak">No skills found yet.</div>}
            >
              <For each={skills()}>
                {(item) => (
                  <button
                    type="button"
                    class="w-full text-left py-3 border-b border-border-weak-base last:border-none"
                    onClick={() => choose(item)}
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="text-14-medium text-text-strong truncate">{item.name}</div>
                        <div class="text-12-regular text-text-weak truncate">{item.description}</div>
                      </div>
                      <span class="text-11-medium text-text-weaker whitespace-nowrap">
                        {managed(item) ? "Managed" : "Read-only"}
                      </span>
                    </div>
                  </button>
                )}
              </For>
            </Show>
          </SettingsList>
        </div>

        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">Skill editor</h3>
          <SettingsList>
            <div class="flex flex-col gap-4 py-4">
              <TextField
                label="Name"
                value={store.name}
                onChange={(value) => setStore("name", value)}
                description="Lowercase letters, numbers, and single hyphens only."
              />
              <TextField
                label="Description"
                value={store.description}
                onChange={(value) => setStore("description", value)}
              />
              <TextField
                label="Content"
                multiline
                value={store.content}
                onChange={(value) => setStore("content", value)}
                description="This is the markdown body of the SKILL.md file after the YAML frontmatter."
                class="min-h-64"
              />
              <TextField
                label="Current file"
                value={store.location || (store.name ? `${root()}/${store.name}/SKILL.md` : "")}
                readOnly
                copyable
              />
              <Show when={store.location && !store.location.startsWith(root())}>
                <p class="text-12-regular text-text-weak">
                  This skill is discovered from another location. Saving will create or update a managed copy in the
                  global config directory.
                </p>
              </Show>
              <div class="flex flex-wrap gap-3">
                <Button onClick={() => void save()} loading={saving()}>
                  Save skill
                </Button>
                <Show when={platform.openPath && (store.location || root())}>
                  <Button variant="ghost" onClick={() => void platform.openPath?.(store.location || root())}>
                    Open path
                  </Button>
                </Show>
                <Button variant="ghost" onClick={() => void actions.refetch()}>
                  Reload list
                </Button>
              </div>
            </div>
          </SettingsList>
        </div>
      </div>
    </div>
  )
}
