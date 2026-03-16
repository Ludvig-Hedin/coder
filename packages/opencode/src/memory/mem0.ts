/**
 * mem0.ts — Long-term memory layer for OpenCode.
 *
 * Uses the Mem0 cloud API (mem0ai package) to store and retrieve memories
 * across coding sessions. Memory is organized in two namespaces:
 *   1. user-level: global preferences/style (keyed by cfg.username)
 *   2. project-level: repo-specific facts (keyed by sha256 of project path)
 *
 * If MEM0_API_KEY is not set, all functions are silent no-ops so the agent
 * continues working normally — memory is purely additive, never blocking.
 */

import { createHash } from "crypto"
import { MemoryClient } from "mem0ai"
import type { Memory, Message } from "mem0ai"

// Lazily cached client instance.
// Undefined = not yet checked; null = disabled (no API key).
let _client: MemoryClient | null | undefined = undefined

/**
 * Returns a configured MemoryClient, or null if MEM0_API_KEY is absent.
 * Cached after the first call — initialization only runs once.
 */
function getClient(): MemoryClient | null {
  if (_client !== undefined) return _client

  const apiKey = process.env.MEM0_API_KEY
  if (!apiKey) {
    // No key — memory silently disabled. Log only when debug flag is set.
    if (process.env.OPENCODE_DEBUG) {
      console.debug("[mem0] MEM0_API_KEY not set — long-term memory disabled")
    }
    _client = null
    return null
  }

  _client = new MemoryClient({ apiKey })
  return _client
}

/**
 * Stable, deterministic ID for a project directory path.
 * Used as the Mem0 user_id for project-scoped memories so the cloud service
 * cannot correlate opaque IDs back to file system paths.
 *
 * e.g. "/home/user/my-app" → "proj:a3f9b1c24d8e7f0a"
 */
export function projectUserId(projectPath: string): string {
  return "proj:" + createHash("sha256").update(projectPath).digest("hex").slice(0, 16)
}

export interface MemorySearchOptions {
  /** cfg.username — keys user-level (cross-project) memories */
  userId: string
  /** Absolute path to the project directory — keys project-scoped memories */
  projectPath: string
  /** Max memories to return in total after merging both namespaces. Default: 8 */
  limit?: number
}

/**
 * Search both the user-level and project-level memory namespaces in parallel,
 * then merge, deduplicate, and return the top results.
 *
 * Always returns an empty array on error — memory failures must never block
 * the agent from responding.
 */
export async function searchMemories(query: string, opts: MemorySearchOptions): Promise<Memory[]> {
  const client = getClient()
  if (!client) return []

  const limit = opts.limit ?? 8
  const projId = projectUserId(opts.projectPath)

  try {
    // Fire two searches concurrently — one per namespace
    const [userMems, projMems] = await Promise.all([
      client.search(query, { user_id: opts.userId, limit }),
      client.search(query, { user_id: projId, limit }),
    ])

    // Merge and deduplicate by memory ID (same fact can appear in both namespaces)
    const seen = new Set<string>()
    const merged: Memory[] = []
    for (const m of [...userMems, ...projMems]) {
      if (m.id && !seen.has(m.id)) {
        seen.add(m.id)
        merged.push(m)
      }
    }

    // Slice to the limit — search results are already relevance-ranked
    return merged.slice(0, limit)
  } catch (err) {
    // Non-fatal: log the error but return empty so the agent continues
    console.error("[mem0] searchMemories error:", (err as Error).message)
    return []
  }
}

export interface MemoryAddOptions {
  /** cfg.username */
  userId: string
  /** Absolute path to the project directory */
  projectPath: string
  /** Session UUID — used as run_id for Mem0 correlation */
  sessionId: string
}

/**
 * Save a conversation exchange to Mem0. Writes concurrently to both the
 * user-level and project-level namespaces. Mem0's internal LLM decides
 * which facts are worth persisting — callers can pass raw message turns.
 *
 * This function swallows all errors internally. Callers SHOULD fire-and-forget
 * it (do not await) so a Mem0 write never delays a response to the user.
 */
export async function addMemory(messages: Message[], opts: MemoryAddOptions): Promise<void> {
  const client = getClient()
  if (!client) return

  const projId = projectUserId(opts.projectPath)

  try {
    // Write to both namespaces concurrently
    await Promise.all([
      client.add(messages, {
        user_id: opts.userId,
        run_id: opts.sessionId,
      }),
      client.add(messages, {
        user_id: projId,
        run_id: opts.sessionId,
        // Tag project memories with the path for potential future filtering
        metadata: { projectPath: opts.projectPath },
      }),
    ])
  } catch (err) {
    // Non-fatal — the conversation continues regardless of write failures
    console.error("[mem0] addMemory error:", (err as Error).message)
  }
}

/**
 * Memory tagged with which namespace it came from, for display in the UI.
 */
export interface LabelledMemory extends Memory {
  scope: "user" | "project"
}

/**
 * Retrieve ALL stored memories for both namespaces, sorted by recency.
 * Used by the settings UI to display, edit, and delete memories.
 */
export async function getAllMemories(opts: Omit<MemorySearchOptions, "limit">): Promise<LabelledMemory[]> {
  const client = getClient()
  if (!client) return []

  const projId = projectUserId(opts.projectPath)

  try {
    const [userMems, projMems] = await Promise.all([
      client.getAll({ user_id: opts.userId }),
      client.getAll({ user_id: projId }),
    ])

    // Tag each memory with its scope (user-level or project-level)
    const seen = new Set<string>()
    const merged: LabelledMemory[] = []

    for (const m of userMems) {
      if (m.id && !seen.has(m.id)) {
        seen.add(m.id)
        merged.push({ ...m, scope: "user" })
      }
    }
    for (const m of projMems) {
      if (m.id && !seen.has(m.id)) {
        seen.add(m.id)
        merged.push({ ...m, scope: "project" })
      }
    }

    // Sort newest-first by updated_at
    merged.sort((a, b) => {
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return bTime - aTime
    })

    return merged
  } catch (err) {
    console.error("[mem0] getAllMemories error:", (err as Error).message)
    return []
  }
}

/**
 * Delete a single memory fact by its Mem0 ID.
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const client = getClient()
  if (!client) return
  await client.delete(memoryId)
}

/**
 * Update the text content of an existing memory fact.
 */
export async function updateMemory(memoryId: string, text: string): Promise<void> {
  const client = getClient()
  if (!client) return
  await client.update(memoryId, { text })
}

/**
 * Manually add a single memory fact to a specific namespace.
 * Uses infer:false so the text is stored verbatim (bypasses Mem0's LLM extraction).
 */
export async function addManualMemory(
  text: string,
  opts: { userId: string; projectPath: string; scope: "user" | "project" },
): Promise<void> {
  const client = getClient()
  if (!client) return

  const targetId = opts.scope === "user" ? opts.userId : projectUserId(opts.projectPath)
  await client.add([{ role: "user", content: text }], {
    user_id: targetId,
    infer: false, // Store verbatim — the user typed this deliberately
  })
}

/**
 * Returns true when MEM0_API_KEY is set (memory is enabled).
 */
export function isMemoryEnabled(): boolean {
  return Boolean(process.env.MEM0_API_KEY)
}

/**
 * Format retrieved memories as a concise XML block for injection into the
 * system prompt. Returns null when there are no memories so callers can
 * simply skip pushing an empty block onto the system array.
 */
export function formatMemoriesForPrompt(memories: Memory[]): string | null {
  const lines = memories
    .map((m) => m.memory?.trim())
    .filter((t): t is string => Boolean(t && t.length > 0))
    .map((t) => `- ${t}`)

  if (lines.length === 0) return null

  return [
    "<memories>",
    "The following facts have been remembered from previous interactions.",
    "Use them to personalize your response, but do not repeat them verbatim.",
    "",
    ...lines,
    "</memories>",
  ].join("\n")
}
