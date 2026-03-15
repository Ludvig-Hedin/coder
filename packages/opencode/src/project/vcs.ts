import { BusEvent } from "@/bus/bus-event"
import { Bus } from "@/bus"
import path from "path"
import z from "zod"
import { Log } from "@/util/log"
import { Instance } from "./instance"
import { FileWatcher } from "@/file/watcher"
import { git } from "@/util/git"
import { which } from "@/util/which"

const log = Log.create({ service: "vcs" })

export namespace Vcs {
  export const Event = {
    BranchUpdated: BusEvent.define(
      "vcs.branch.updated",
      z.object({
        branch: z.string().optional(),
      }),
    ),
  }

  export const Info = z
    .object({
      branch: z.string().optional(),
      remote: z.string().optional(),
      gh: z.boolean(),
    })
    .meta({
      ref: "VcsInfo",
    })
  export type Info = z.infer<typeof Info>

  async function currentBranch() {
    const result = await git(["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: Instance.worktree,
    })
    if (result.exitCode !== 0) return
    const text = result.text().trim()
    if (!text) return
    return text
  }

  async function currentRemote() {
    const result = await git(["remote"], {
      cwd: Instance.worktree,
    })
    if (result.exitCode !== 0) return
    const list = result
      .text()
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
    if (list.includes("origin")) return "origin"
    return list[0]
  }

  const state = Instance.state(
    async () => {
      if (Instance.project.vcs !== "git") {
        return { branch: async () => undefined, unsubscribe: undefined }
      }
      let current = await currentBranch()
      log.info("initialized", { branch: current })

      const unsubscribe = Bus.subscribe(FileWatcher.Event.Updated, async (evt) => {
        if (evt.properties.file.endsWith("HEAD")) return
        const next = await currentBranch()
        if (next !== current) {
          log.info("branch changed", { from: current, to: next })
          current = next
          Bus.publish(Event.BranchUpdated, { branch: next })
        }
      })

      return {
        branch: async () => current,
        unsubscribe,
      }
    },
    async (state) => {
      state.unsubscribe?.()
    },
  )

  export async function init() {
    return state()
  }

  export async function branch() {
    return await state().then((s) => s.branch())
  }

  export async function get(): Promise<Info> {
    return {
      branch: await branch(),
      remote: Instance.project.vcs === "git" ? await currentRemote() : undefined,
      gh: which("gh") !== null,
    }
  }
}
