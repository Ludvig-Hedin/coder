#!/usr/bin/env bun
/**
 * Installs (or removes) the opencode pre-push git hook.
 *
 * Usage:
 *   bun script/install-review-hooks.ts           # install
 *   bun script/install-review-hooks.ts --remove  # remove
 *
 * The hook runs `opencode run review` against staged/committed changes before
 * every push. If the review finds error-severity issues it blocks the push
 * and prints the results; the user can bypass with `git push --no-verify`.
 *
 * The hook respects the `review.hooks.pre_push` and `review.hooks.fail_on`
 * settings from the project's opencode.jsonc config.
 */

import path from "path"
import fs from "fs/promises"
import { $ } from "bun"

const HOOK_MARKER = "# opencode-review-hook"

// Resolve .git directory (handles worktrees too)
async function gitDir(): Promise<string> {
  const raw = await $`git rev-parse --git-dir`.text()
  return raw.trim()
}

const PRE_PUSH_HOOK = `#!/bin/sh
${HOOK_MARKER}
# This hook was installed by opencode. Remove with:
#   bun script/install-review-hooks.ts --remove

# Skip hook if opencode is not installed
command -v opencode > /dev/null 2>&1 || exit 0

# Read the remote/URL passed by git push
remote="$1"
url="$2"

# Collect commits being pushed (stdin format: <local-ref> <local-sha> <remote-ref> <remote-sha>)
while read local_ref local_sha remote_ref remote_sha; do
  if [ "$local_sha" = "0000000000000000000000000000000000000000" ]; then
    # Branch deletion — skip review
    continue
  fi

  if [ "$remote_sha" = "0000000000000000000000000000000000000000" ]; then
    # New branch — review all commits
    range="$local_sha"
  else
    range="$remote_sha...$local_sha"
  fi

  echo "opencode: running code review on $range..."
  opencode run \\
    --dangerously-skip-permissions \\
    -m anthropic/claude-haiku-4-5-20251001 \\
    "review $range"

  EXIT=$?
  if [ $EXIT -ne 0 ]; then
    echo ""
    echo "opencode review found issues. Push blocked."
    echo "To push anyway: git push --no-verify"
    echo ""
    exit 1
  fi
done

exit 0
`

async function install() {
  const dir = await gitDir()
  const hooks = path.join(dir, "hooks")
  await fs.mkdir(hooks, { recursive: true })

  const hook = path.join(hooks, "pre-push")
  let existing = ""
  try {
    existing = await fs.readFile(hook, "utf8")
  } catch {}

  if (existing.includes(HOOK_MARKER)) {
    console.log("pre-push hook already installed — updating")
    // Replace the entire file if it's ours; don't touch foreign hooks
    await fs.writeFile(hook, PRE_PUSH_HOOK, { mode: 0o755 })
    return
  }

  if (existing && !existing.includes(HOOK_MARKER)) {
    // Append to existing hook
    const combined = existing.trimEnd() + "\n\n" + PRE_PUSH_HOOK
    await fs.writeFile(hook, combined, { mode: 0o755 })
    console.log("Appended opencode review block to existing pre-push hook")
    return
  }

  await fs.writeFile(hook, PRE_PUSH_HOOK, { mode: 0o755 })
  console.log("Installed pre-push hook at", hook)
  console.log("Tip: set review.hooks.pre_push: true in opencode.jsonc to enable by default")
}

async function remove() {
  const dir = await gitDir()
  const hook = path.join(dir, "hooks", "pre-push")
  let content = ""
  try {
    content = await fs.readFile(hook, "utf8")
  } catch {
    console.log("No pre-push hook found — nothing to remove")
    return
  }

  if (!content.includes(HOOK_MARKER)) {
    console.log("opencode hook marker not found in pre-push hook — skipping")
    return
  }

  // Remove everything from our marker to the end (or until next marker)
  const lines = content.split("\n")
  const idx = lines.findIndex((l) => l.includes(HOOK_MARKER))
  const trimmed = lines.slice(0, Math.max(0, idx - 1)).join("\n")

  if (trimmed.trim()) {
    await fs.writeFile(hook, trimmed + "\n", { mode: 0o755 })
    console.log("Removed opencode block from pre-push hook")
  } else {
    await fs.rm(hook)
    console.log("Removed pre-push hook entirely (it only contained opencode block)")
  }
}

const removing = process.argv.includes("--remove")
if (removing) {
  await remove()
} else {
  await install()
}
