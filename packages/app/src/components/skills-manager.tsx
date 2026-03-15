import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon, type IconName } from "@opencode-ai/ui/icon"
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

type Template = {
  name: string
  title: string
  category: string
  icon: IconName
  description: string
  preview: string
  content: string
}

type Detail =
  | { type: "template"; item: Template; added: boolean }
  | { type: "skill"; item: Skill; added: boolean }

type Entry =
  | { type: "template"; item: Template; added: boolean }
  | { type: "skill"; item: Skill; added: boolean }

const templates: Template[] = [
  {
    name: "beautiful-design",
    title: "Beautiful design",
    category: "Design",
    icon: "prompt",
    description: "Refine an existing UI into a tighter, calmer, product-ready visual design.",
    preview: "Restyles existing UI without changing layout or behavior, with tighter spacing, calmer surfaces, and stronger hierarchy.",
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
    category: "Research",
    icon: "magnifying-glass",
    description: "Review one app area for clarity, friction, hierarchy, discoverability, and ease of use.",
    preview: "Audits one product area for clarity, cognitive load, discoverability, friction, and practical UX improvements.",
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
    category: "Engineering",
    icon: "check",
    description: "Review code from the current session for correctness, safety, maintainability, and gaps.",
    preview: "Runs a structured review for correctness, safety, maintainability, testing gaps, and approval readiness.",
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
  {
    name: "github-branch-versioning-analysis",
    title: "Git branch strategy",
    category: "Git",
    icon: "branch",
    description: "Audit branch organization and versioning, then recommend a cleaner release and branching model.",
    preview: "Shows current git state first, then proposes branch naming, release tagging, changelog discipline, and workflow automation.",
    content: [
      "# GitHub Branch Organization & Versioning Analysis",
      "",
      "## Investigate current state",
      "",
      "- Check local git branches with `git branch -a`.",
      "- Review the GitHub repository branch structure if remote access is available.",
      "- Analyze existing commit history and naming patterns.",
      "- Document the current versioning approach, if any.",
      "",
      "## Implement organized branch strategy",
      "",
      "### Branch naming convention",
      "",
      "- `feature/YYYY-MM-DD-short-description`",
      "- `fix/YYYY-MM-DD-issue-description`",
      "- `release/v1.x.x` for stable versions",
      "",
      "Examples:",
      "",
      "- `feature/2025-05-31-profile-forms`",
      "- `fix/2025-05-31-auth-cookies`",
      "",
      "### Release versioning",
      "",
      "- `v1.0.0`: MVP with basic chat and profile",
      "- `v1.1.0`: feature increments",
      "- `v1.x.x`: continuing feature increments",
      "",
      "### Documentation strategy",
      "",
      "- Tag each working milestone with date and description.",
      "- Update `CHANGELOG.md` with version numbers.",
      "- Create GitHub releases for major features.",
      "- Recommend branch protection rules for `main`.",
      "",
      "## Tasks",
      "",
      "1. Audit the current git structure.",
      "2. Propose an organized branching model.",
      "3. Identify whether the current stable state is suitable for `v1.0.0`.",
      "4. Propose an automated versioning workflow.",
      "",
      "## Output requirements",
      "",
      "- Show the current state first.",
      "- Then recommend the improved organization.",
      "- Distinguish clearly between observations, risks, and recommendations.",
      "- Do not create branches, tags, releases, or automation unless the user explicitly asks for changes after the analysis.",
    ].join("\n"),
  },
]

export const SkillsManager: Component = () => {
  const dialog = useDialog()
  const sdk = useGlobalSDK()
  const sync = useGlobalSync()
  const language = useLanguage()
  const platform = usePlatform()
  const [saving, setSaving] = createSignal<string>()
  const [removing, setRemoving] = createSignal<string>()
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

  const managed = (item: Pick<Skill, "name" | "location"> | undefined) => !!item && item.location.startsWith(root())
  const installed = createMemo(() => new Set((skills() ?? []).filter(managed).map((item) => item.name)))
  const top = createMemo(() => (skills() ?? []).filter(managed))
  const all = createMemo<Entry[]>(() => {
    const list: Entry[] = templates.map((item) => ({
      type: "template",
      item,
      added: installed().has(item.name),
    }))
    for (const item of skills() ?? []) {
      if (templates.some((template) => template.name === item.name)) continue
      list.push({
        type: "skill",
        item,
        added: managed(item),
      })
    }
    return list
  })

  const choose = (item?: Skill) => {
    setStore({
      name: item?.name ?? "",
      description: item?.description ?? "",
      content: item?.content ?? "",
      location: item?.location ?? "",
    })
  }

  const notify = (message: string) => {
    showToast({ title: language.t("common.requestFailed"), description: message })
  }

  const save = async (input: { name: string; description: string; content: string }, toast: string) => {
    setSaving(input.name)
    await sdk.client.app
      .saveSkill(
        {
          name: input.name.trim(),
          description: input.description.trim(),
          content: input.content,
        },
        { throwOnError: true },
      )
      .then(async (result) => {
        const item = result.data
        if (item) choose(item)
        showToast({
          variant: "success",
          icon: "circle-check",
          title: "Skill saved",
          description: toast,
        })
        await actions.refetch()
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        notify(message)
      })
      .finally(() => setSaving(undefined))
  }

  const remove = async (name: string) => {
    setRemoving(name)
    await sdk.client.app
      .deleteSkill({ name }, { throwOnError: true })
      .then(async () => {
        if (store.name === name) choose()
        showToast({
          variant: "success",
          icon: "circle-check",
          title: "Skill removed",
          description: "The managed copy was removed.",
        })
        await actions.refetch()
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        notify(message)
      })
      .finally(() => setRemoving(undefined))
  }

  const addTemplate = async (item: Template) =>
    save(
      {
        name: item.name,
        description: item.description,
        content: item.content,
      },
      "The template was added as a managed skill.",
    )

  const addSkill = async (item: Skill) =>
    save(
      {
        name: item.name,
        description: item.description,
        content: item.content,
      },
      "The skill was added to your managed library.",
    )

  const open = (detail: Detail) => {
    dialog.show(() => (
      <DialogSkill
        detail={detail}
        root={root()}
        onAdd={() => (detail.type === "template" ? addTemplate(detail.item) : addSkill(detail.item))}
        onRemove={() => remove(detail.item.name)}
        onEdit={() => {
          if (detail.type === "skill") choose(detail.item)
          if (detail.type === "template") {
            setStore({
              name: detail.item.name,
              description: detail.item.description,
              content: detail.item.content,
              location: "",
            })
          }
          dialog.close()
        }}
        saving={saving}
        removing={removing}
      />
    ))
  }

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,var(--surface-stronger-non-alpha)_calc(100%_-_24px),transparent)]">
        <div class="flex flex-col gap-2 pt-6 pb-8 max-w-[960px]">
          <h2 class="text-16-medium text-text-strong">Skills</h2>
          <p class="text-13-regular text-text-weak">
            Browse every available skill, inspect details before adding them, and manage your installed copies.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-8 max-w-[960px]">
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-14-medium text-text-strong">Installed skills</h3>
              <p class="pt-1 text-12-regular text-text-weak">Managed skills currently added to your library.</p>
            </div>
            <div class="text-12-medium text-text-weaker">{top().length} installed</div>
          </div>
          <Show
            when={top().length > 0}
            fallback={
              <div class="rounded-lg border border-border-weak-base px-4 py-6 text-14-regular text-text-weak">
                No skills added yet.
              </div>
            }
          >
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <For each={top()}>
                {(item) => (
                  <SkillCard
                    title={item.name}
                    category="Installed"
                    icon="circle-check"
                    description={item.description}
                    preview={item.location}
                    added={true}
                    saving={saving() === item.name}
                    removing={removing() === item.name}
                    onOpen={() => open({ type: "skill", item, added: true })}
                    onAdd={() => void addSkill(item)}
                    onRemove={() => void remove(item.name)}
                  />
                )}
              </For>
            </div>
          </Show>
        </section>

        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-14-medium text-text-strong">All skills</h3>
              <p class="pt-1 text-12-regular text-text-weak">
                Browse built-in templates and discovered skills from every configured source.
              </p>
            </div>
            <Button variant="ghost" onClick={() => choose()}>
              New custom skill
            </Button>
          </div>
          <Show
            when={all().length > 0}
            fallback={
              <div class="rounded-lg border border-border-weak-base px-4 py-6 text-14-regular text-text-weak">
                No skills found yet.
              </div>
            }
          >
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <For each={all()}>
                {(item) => (
                  <SkillCard
                    title={item.type === "template" ? item.item.title : item.item.name}
                    category={
                      item.type === "template"
                        ? item.added
                          ? "Installed template"
                          : item.item.category
                        : item.added
                          ? "Installed"
                          : "Available"
                    }
                    icon={item.type === "template" ? item.item.icon : item.added ? "circle-check" : "prompt"}
                    description={item.item.description}
                    preview={item.type === "template" ? item.item.preview : item.item.location}
                    added={item.added}
                    saving={saving() === item.item.name}
                    removing={removing() === item.item.name}
                    onOpen={() => open(item)}
                    onAdd={() => void (item.type === "template" ? addTemplate(item.item) : addSkill(item.item))}
                    onRemove={() => void remove(item.item.name)}
                  />
                )}
              </For>
            </div>
          </Show>
        </section>

        <section class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">Custom skill editor</h3>
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
                description="Markdown body written after the YAML frontmatter."
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
                  This source skill is read-only here. Saving creates or updates your managed copy in the global config
                  directory.
                </p>
              </Show>
              <div class="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    void save(
                      {
                        name: store.name,
                        description: store.description,
                        content: store.content,
                      },
                      "The managed skill file has been updated.",
                    )
                  }
                  loading={saving() === store.name}
                >
                  Save skill
                </Button>
                <Show when={managed({ name: store.name, location: store.location })}>
                  <Button variant="ghost" onClick={() => void remove(store.name)} loading={removing() === store.name}>
                    Remove managed copy
                  </Button>
                </Show>
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
        </section>
      </div>
    </div>
  )
}

const SkillCard: Component<{
  title: string
  category: string
  icon: IconName
  description: string
  preview: string
  added: boolean
  saving: boolean
  removing: boolean
  onOpen: () => void
  onAdd: () => void
  onRemove: () => void
}> = (props) => {
  return (
    <div class="group flex h-full flex-col rounded-lg border border-border-weak-base bg-surface-base p-4 transition-colors hover:bg-surface-base-hover">
      <button type="button" class="flex flex-1 flex-col text-left" onClick={props.onOpen}>
        <div class="flex items-start gap-3">
          <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-panel text-icon-base">
            <Icon name={props.icon} size="small" />
          </div>
          <div class="min-w-0">
            <div class="text-11-medium uppercase tracking-[0.04em] text-text-weaker">{props.category}</div>
            <div class="truncate text-14-medium text-text-strong">{props.title}</div>
          </div>
        </div>
        <p class="pt-3 line-clamp-2 text-13-regular text-text-weak">{brief(props.description, 78)}</p>
        <p class="pt-2 line-clamp-2 break-all text-12-regular text-text-weaker">{brief(props.preview, 92)}</p>
      </button>
      <div class="flex items-center gap-2 pt-4">
        <div class="shrink-0">
          <Show
            when={props.added}
            fallback={
              <Button size="small" variant="secondary" onClick={props.onAdd} loading={props.saving}>
                Add
              </Button>
            }
          >
            <Button size="small" variant="ghost" onClick={props.onRemove} loading={props.removing}>
              Remove
            </Button>
          </Show>
        </div>
        <Button size="small" variant="ghost" onClick={props.onOpen}>
          Read more
        </Button>
      </div>
    </div>
  )
}

const DialogSkill: Component<{
  detail: Detail
  root: string
  saving: () => string | undefined
  removing: () => string | undefined
  onAdd: () => Promise<void>
  onRemove: () => Promise<void>
  onEdit: () => void
}> = (props) => {
  const dialog = useDialog()
  const item = () => props.detail.item
  const added = () => props.detail.added
  const kind = () => (props.detail.type === "template" ? "Built-in template" : added() ? "Installed skill" : "Available skill")
  const source = () => {
    if (props.detail.type === "template") return "Template"
    return (item() as Skill).location.startsWith(props.root) ? "Managed copy" : "Read-only source"
  }

  return (
    <Dialog
      title=""
      description=""
      class="w-full max-w-[820px] mx-auto"
    >
      <div class="flex flex-col gap-4 px-1 pb-1">
        <div class="flex flex-col gap-3 border-b border-border-weak-base pb-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-11-medium uppercase tracking-[0.04em] text-text-weaker">{kind()}</div>
              <h2 class="pt-1 text-[30px] font-medium leading-[1.05] tracking-[-0.03em] text-text-strong">
                {item().name}
              </h2>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-md border border-border-weak-base bg-surface-panel px-2.5 py-1 text-11-medium text-text-weak">
                {source()}
              </span>
              <Show when={added()}>
                <span class="rounded-md border border-border-weak-base bg-surface-panel px-2.5 py-1 text-11-medium text-text-weak">
                  Installed
                </span>
              </Show>
            </div>
          </div>
          <p class="max-w-[680px] text-13-regular leading-6 text-text-weak">{item().description}</p>
        </div>

        <div class="grid gap-3">
          <div class="rounded-lg border border-border-weak-base bg-surface-panel px-4 py-3">
            <div class="pb-2 text-11-medium uppercase tracking-[0.04em] text-text-weaker">Skill content</div>
            <pre class="max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-[13px] leading-6 text-text-strong">
              {item().content}
            </pre>
          </div>

          <Show when={props.detail.type === "skill"}>
            <div class="rounded-lg border border-border-weak-base bg-surface-base px-4 py-3">
              <div class="pb-1 text-11-medium uppercase tracking-[0.04em] text-text-weaker">Source path</div>
              <div class="break-all text-12-regular leading-5 text-text-weak">{(item() as Skill).location}</div>
            </div>
          </Show>

          <div class="flex flex-wrap items-center gap-2 border-t border-border-weak-base pt-1">
            <Show
              when={added()}
              fallback={
                <Button
                  size="small"
                  onClick={() =>
                    void props.onAdd().finally(() => {
                      dialog.close()
                    })
                  }
                  loading={props.saving() === item().name}
                >
                  Add skill
                </Button>
              }
            >
              <Button
                size="small"
                variant="ghost"
                onClick={() =>
                  void props.onRemove().finally(() => {
                    dialog.close()
                  })
                }
                loading={props.removing() === item().name}
              >
                Remove skill
              </Button>
            </Show>
            <Button size="small" variant="secondary" onClick={props.onEdit}>
              {added() ? "Edit managed copy" : "Open in editor"}
            </Button>
            <Button size="small" variant="ghost" onClick={() => dialog.close()}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

function brief(text: string, max: number) {
  const value = text.replace(/\s+/g, " ").trim()
  if (value.length <= max) return value
  return `${value.slice(0, max).trimEnd()}...`
}
