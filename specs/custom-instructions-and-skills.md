# Custom Instructions and Skills

## Status

- Added a settings UI for editing the global `AGENTS.md` file.
- Added preset controls for quickly generating instruction starters.
- Added a settings UI for viewing discovered skills and saving managed global skills.
- Added built-in skill templates in the settings UI for beautiful design, UX assessment, code review, and git branch strategy workflows.
- Added project-local skills for safe file-splitting refactors and git branch/versioning analysis.
- Added server endpoints for reading and writing the global `AGENTS.md` file and managed `SKILL.md` files.

## User-facing behavior

- Settings now includes a `Custom instructions` tab.
- Settings now includes a `Skills` tab.
- Built-in skill templates are shown as category cards with clearer preview copy.
- Managed skills are written to `~/.config/opencode/skills/<name>/SKILL.md`.
- Global custom instructions are written to `~/.config/opencode/AGENTS.md`.

## Architecture notes

- The UI does not invent a separate prompt layer.
- Custom instructions map directly to the existing `AGENTS.md` instruction file already consumed by the prompt stack.
- Skill creation maps directly to the existing on-disk `SKILL.md` discovery flow.
- The server disposes active instances after writes so prompt and skill changes are picked up without requiring manual file edits.
