import { Hono } from "hono"
import { describeRoute, resolver, validator } from "hono-openapi"
import z from "zod"
import { lazy } from "../../util/lazy"
import { errors } from "../error"
import { Config } from "../../config/config"
import { Instance } from "../../project/instance"
import { getAllMemories, deleteMemory, updateMemory, addManualMemory, isMemoryEnabled } from "../../memory/mem0"

// Schema for a single memory item returned to the UI
const MemoryItem = z.object({
  id: z.string(),
  memory: z.string().optional(),
  scope: z.enum(["user", "project"]),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
})

export const MemoryRoutes = lazy(() =>
  new Hono()
    .get(
      "/",
      describeRoute({
        summary: "List all memories",
        description: "Retrieve all stored memories for the current user and project. Returns enabled:false if MEM0_API_KEY is not set.",
        operationId: "memory.list",
        responses: {
          200: {
            description: "List of memories",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    enabled: z.boolean(),
                    memories: MemoryItem.array(),
                  }),
                ),
              },
            },
          },
        },
      }),
      async (c) => {
        if (!isMemoryEnabled()) return c.json({ enabled: false, memories: [] })

        const cfg = await Config.get()
        const memories = await getAllMemories({
          userId: cfg.username ?? "anonymous",
          projectPath: Instance.directory,
        })
        // Serialize dates to ISO strings for JSON transport
        return c.json({
          enabled: true,
          memories: memories.map((m) => ({
            ...m,
            created_at: m.created_at ? new Date(m.created_at).toISOString() : null,
            updated_at: m.updated_at ? new Date(m.updated_at).toISOString() : null,
          })),
        })
      },
    )

    .post(
      "/",
      describeRoute({
        summary: "Add a memory",
        description: "Manually add a memory fact to the user or project namespace.",
        operationId: "memory.add",
        responses: {
          200: {
            description: "Added successfully",
            content: { "application/json": { schema: resolver(z.boolean()) } },
          },
          ...errors(400),
        },
      }),
      validator(
        "json",
        z.object({
          text: z.string().min(1).max(2000),
          scope: z.enum(["user", "project"]).default("user"),
        }),
      ),
      async (c) => {
        const { text, scope } = c.req.valid("json")
        const cfg = await Config.get()
        await addManualMemory(text, {
          userId: cfg.username ?? "anonymous",
          projectPath: Instance.directory,
          scope,
        })
        return c.json(true)
      },
    )

    .patch(
      "/:id",
      describeRoute({
        summary: "Update a memory",
        description: "Update the text of an existing memory fact.",
        operationId: "memory.update",
        responses: {
          200: {
            description: "Updated successfully",
            content: { "application/json": { schema: resolver(z.boolean()) } },
          },
          ...errors(400),
        },
      }),
      validator(
        "json",
        z.object({
          text: z.string().min(1).max(2000),
        }),
      ),
      async (c) => {
        const id = c.req.param("id")
        const { text } = c.req.valid("json")
        await updateMemory(id, text)
        return c.json(true)
      },
    )

    .delete(
      "/:id",
      describeRoute({
        summary: "Delete a memory",
        description: "Delete a specific memory fact by ID.",
        operationId: "memory.delete",
        responses: {
          204: { description: "Deleted" },
          ...errors(400),
        },
      }),
      async (c) => {
        const id = c.req.param("id")
        await deleteMemory(id)
        return c.body(null, 204)
      },
    ),
)
