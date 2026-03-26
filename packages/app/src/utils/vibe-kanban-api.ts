// API client for the vibe-kanban backend.
// The relay signature middleware only applies to requests with the RELAY_HEADER ("1").
// Direct browser requests have no such header, so they bypass auth entirely.

const BASE_URL = () => (import.meta.env.VITE_VIBE_KANBAN_URL ?? "").replace(/\/$/, "")

export type VkWorkspace = {
  id: string
  name: string | null
  branch: string
  setup_completed_at: string | null
  created_at: string
  updated_at: string
  archived: boolean
  pinned: boolean
  worktree_deleted: boolean
  task_id: string | null
  container_ref: string | null
}

export type VkRepo = {
  id: string
  path: string
  name: string
  display_name: string
  default_target_branch: string | null
}

export type VkWorkspaceSummary = {
  workspace_id: string
  latest_session_id: string | null
  has_pending_approval: boolean
  files_changed: number | null
  lines_added: number | null
  lines_removed: number | null
  latest_process_completed_at?: string
  latest_process_status: "running" | "completed" | "failed" | "killed" | null
  has_running_dev_server: boolean
  has_unseen_turns: boolean
  pr_status: string | null
  pr_url: string | null
}

type ApiResp<T> = {
  success: boolean
  data: T | null
  message: string | null
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL()}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...((init?.headers as Record<string, string>) ?? {}) },
  })
  if (!res.ok) throw new Error(`vibe-kanban: ${res.status} ${res.statusText}`)
  const body: ApiResp<T> = await res.json()
  if (!body.success || body.data == null) throw new Error(body.message ?? "API error")
  return body.data
}

export const vibeKanban = {
  listWorkspaces: () => apiFetch<VkWorkspace[]>("/workspaces"),

  listRepos: () => apiFetch<VkRepo[]>("/repos"),

  getWorkspaceSummaries: (archived = false) =>
    apiFetch<{ summaries: VkWorkspaceSummary[] }>("/workspaces/summaries", {
      method: "POST",
      body: JSON.stringify({ archived }),
    }).then((r) => r.summaries),

  createAndStart: (params: { name: string; repoId: string; branch: string; prompt: string }) =>
    apiFetch<{ workspace_id: string; session_id: string }>("/workspaces/start", {
      method: "POST",
      body: JSON.stringify({
        name: params.name,
        repos: [{ repo_id: params.repoId, target_branch: params.branch }],
        linked_issue: null,
        executor_config: { executor: "OPENCODE" },
        prompt: params.prompt,
        attachment_ids: null,
      }),
    }),

  archiveWorkspace: (id: string) =>
    apiFetch<VkWorkspace>(`/workspaces/${id}`, {
      method: "PUT",
      body: JSON.stringify({ archived: true }),
    }),
}
