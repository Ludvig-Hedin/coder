export type AutomItem = {
  id: string
  name: string
  note: string
  project: string
  status: "paused"
}

export const seedAutomations = (): AutomItem[] => [
  {
    id: "seed-review",
    name: "Automated Code Review & Maintenance Agent",
    note: "Scans the repo for regressions and flags risky changes.",
    project: "nutri-track-ai-new",
    status: "paused",
  },
  {
    id: "seed-soma",
    name: "Autonomous execution agent for the Soma project.",
    note: "Runs the daily execution loop and posts a concise project update.",
    project: "nutri-track-ai-new",
    status: "paused",
  },
]

const slug = () => Math.random().toString(36).slice(2, 10)

export const createAutom = (input: {
  title: string
  prompt: string
  project: string
  status?: "paused"
}): AutomItem => {
  const name = input.title.trim() || input.prompt.trim().split("\n")[0] || "Untitled automation"
  return {
    id: `local-${slug()}`,
    name,
    note: input.prompt.trim() || "New automation draft",
    project: input.project,
    status: input.status ?? "paused",
  }
}

export const appendAutom = (list: AutomItem[], input: { title: string; prompt: string; project: string }) => [
  createAutom(input),
  ...list,
]
