# Automations UI Phase 1

This phase adds a top-level `Automations` page and a Codex-inspired create modal in `packages/app`.

Current scope:
- Global `/automations` route in the existing app shell
- Sidebar entry for `Automations`
- Static seeded list rows for paused automations
- Working `New automation` modal with editable title, prompt, and placeholder selectors
- Local in-memory create flow that prepends a new paused automation row

Deferred on purpose:
- Persistent storage
- Automation execution
- Real scheduling
- Real project/model binding
- Backend APIs

This keeps the first pass user-facing and reviewable while leaving the automation engine for a later phase.
