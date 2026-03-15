export type AutomItem = {
  id: string
  name: string
  note: string
  project: string
  status: "paused"
}

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
