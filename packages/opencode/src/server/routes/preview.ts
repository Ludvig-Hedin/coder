import { Hono } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import z from "zod"
import { Preview } from "@/preview"
import { Instance } from "@/project/instance"
import { errors } from "../error"
import { lazy } from "../../util/lazy"

export const PreviewRoutes = lazy(
  () =>
    new Hono()
      // ── Detect tech stack ────────────────────────────────────────────────
      .get(
        "/detect",
        describeRoute({
          summary: "Detect project tech stack",
          description:
            "Inspect the current project directory to determine the most likely dev-server command (Vite, Next.js, Cargo, etc.).",
          operationId: "preview.detect",
          responses: {
            200: {
              description: "Detected tech stack and suggested command",
              content: {
                "application/json": {
                  schema: resolver(Preview.DetectResult),
                },
              },
            },
          },
        }),
        async (c) => {
          const result = await Preview.detect(Instance.directory)
          return c.json(result)
        },
      )

      // ── Start preview server ─────────────────────────────────────────────
      .post(
        "/start",
        describeRoute({
          summary: "Start preview dev server",
          description:
            "Spawn a dev server PTY with the given command. The server polls PTY output for a localhost URL and emits a `preview.ready` event when found.",
          operationId: "preview.start",
          responses: {
            200: {
              description: "PTY info for the spawned server process",
              content: {
                "application/json": {
                  schema: resolver(
                    z
                      .object({
                        ptyId: z.string(),
                      })
                      .meta({ ref: "PreviewStartResult" }),
                  ),
                },
              },
            },
            ...errors(400),
          },
        }),
        validator(
          "json",
          z.object({
            command: z.string().meta({ description: "Executable to run (e.g. npm, bun, cargo)" }),
            args: z.array(z.string()).meta({ description: "Arguments passed to the command" }),
          }),
        ),
        async (c) => {
          const { command, args } = c.req.valid("json")
          const info = await Preview.start({
            cwd: Instance.directory,
            command,
            args,
          })
          return c.json({ ptyId: info.id })
        },
      )

      // ── Stop preview server ──────────────────────────────────────────────
      .post(
        "/stop",
        describeRoute({
          summary: "Stop preview dev server",
          description: "Kill the currently running preview dev server for this project.",
          operationId: "preview.stop",
          responses: {
            200: {
              description: "true if a server was stopped, false if nothing was running",
              content: {
                "application/json": {
                  schema: resolver(z.boolean()),
                },
              },
            },
          },
        }),
        async (c) => {
          const ok = await Preview.stop()
          return c.json(ok)
        },
      )

      // ── Status ───────────────────────────────────────────────────────────
      .get(
        "/status",
        describeRoute({
          summary: "Get preview server status",
          description: "Returns whether a preview dev server is currently running for this project.",
          operationId: "preview.status",
          responses: {
            200: {
              description: "Preview server status",
              content: {
                "application/json": {
                  schema: resolver(
                    z
                      .object({
                        ptyId: z.string().optional(),
                        running: z.boolean(),
                      })
                      .meta({ ref: "PreviewStatus" }),
                  ),
                },
              },
            },
          },
        }),
        async (c) => {
          return c.json(Preview.status())
        },
      ),
)
