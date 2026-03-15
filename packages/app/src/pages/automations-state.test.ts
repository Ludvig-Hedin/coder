import { describe, expect, test } from "bun:test"
import { appendAutom, createAutom } from "./automations-state"

describe("createAutom", () => {
  test("falls back to the prompt when the title is blank", () => {
    const item = createAutom({
      title: "   ",
      prompt: "Look for crashes in $sentry",
      project: "coder",
    })

    expect(item.name).toBe("Look for crashes in $sentry")
    expect(item.project).toBe("coder")
    expect(item.status).toBe("paused")
  })
})

describe("appendAutom", () => {
  test("prepends the new automation to the list", () => {
    const list = appendAutom(
      [
        {
          id: "seed",
          name: "Existing",
          note: "Seed",
          project: "coder",
          status: "paused",
        },
      ],
      {
        title: "Daily report",
        prompt: "Summarize open regressions",
        project: "coder",
      },
    )

    expect(list).toHaveLength(2)
    expect(list[0]?.name).toBe("Daily report")
    expect(list[1]?.id).toBe("seed")
  })
})
