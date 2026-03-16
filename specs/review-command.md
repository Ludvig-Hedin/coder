# Review Command

## Status

- The session toolbar review action triggers the existing `session.review.run` command.
- The command opens `DialogReview`, then sends the built-in `/review` session command through `sdk.client.session.command`.
- UI uses the existing `review` icon token from `packages/ui` instead of introducing a new icon name.

## Notes

- `command.trigger(id)` is the supported app command API for toolbar actions.
- `sdk.client.session.command(...)` expects the `command` field, not `commandName`.
