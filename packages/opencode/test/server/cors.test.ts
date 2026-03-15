import { describe, expect, test } from "bun:test"
import { Server } from "../../src/server/server"

describe("Server.origin", () => {
  test("allows exact configured origins", () => {
    expect(Server.origin("https://cloud-agent-dev.vercel.app", ["https://cloud-agent-dev.vercel.app"])).toBe(
      "https://cloud-agent-dev.vercel.app",
    )
  })

  test("allows configured wildcard suffix origins", () => {
    expect(
      Server.origin("https://feature-ludvighedin15-gmailcoms-projects.vercel.app", [
        "*ludvighedin15-gmailcoms-projects.vercel.app",
      ]),
    ).toBe("https://feature-ludvighedin15-gmailcoms-projects.vercel.app")
  })

  test("rejects wildcard suffix when no subdomain prefix exists", () => {
    expect(
      Server.origin("https://ludvighedin15-gmailcoms-projects.vercel.app", [
        "*ludvighedin15-gmailcoms-projects.vercel.app",
      ]),
    ).toBeUndefined()
  })

  test("rejects wildcard suffix for non-https origins", () => {
    expect(
      Server.origin("http://feature-ludvighedin15-gmailcoms-projects.vercel.app", [
        "*ludvighedin15-gmailcoms-projects.vercel.app",
      ]),
    ).toBeUndefined()
  })
})
