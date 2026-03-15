# Open In Editor Button

## Status

- Implemented in the session header for desktop sessions.

## Behavior

- Shows a desktop-only `Open in …` button in the session header on `md` and up.
- Detects supported installed editors via the existing desktop platform bridge and lists detected apps in a dropdown.
- Uses the selected editor as the primary button action.
- Falls back to the OS default folder opener when no supported editor is detected.
- Hides on mobile-sized layouts.

## Notes

- The button opens the current workspace directory, not an individual file.
- The dropdown also includes a copy-path action for the current workspace.
