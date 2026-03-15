# Icon strategy

## Current usage

- `packages/ui/src/components/icon.tsx` exports the `Icon` component, which renders a `<svg>` whose `innerHTML` is selected from the large `icons` dictionary of hard-coded `<path>` strings. Icons used throughout the UI (context menus, toolbars, feedback indicators, etc.) reference that component by name.
- `packages/ui/src/components/provider-icon.tsx` and the matching sprite at `packages/ui/src/components/provider-icons/sprite.svg` render provider-brand logos via `<use>` fragments. The allowed ids are enumerated in `provider-icons/types.ts`.
- File-type icons and app icons follow the same sprite approach, so any sprite regeneration script also affects them (see `packages/ui/src/components/file-icons` and `packages/ui/src/components/app-icons`).

> The new Tabler-based mapping is captured in `docs/icon-mapping.md`; refresh it before regenerating the snippets that `Icon` consumes.

## Switching to Lucide or Tabler icons

1. Add the Solid-compatible package you want, for example `bun add lucide-solid` or `bun add tabler-icons-solid` from the repo root. Avoid multiple icon libraries unless you need both styles.
2. Import the icons you need in `Icon`. Instead of the `icons` dictionary you can map names to the Solid components exported by those packages (`import { ArrowRight, Check } from "lucide-solid"`). Provide a small shim that accepts the existing `name` values and renders the matching component (or falls back to the legacy sprite for cases not yet ported).
3. Update any callers that still pass a string name that changed, ideally keeping the string aliases so the UI code doesn’t need simultaneous edits. Consider keeping `Icon`’s `name` prop typed as a union that can be extended with `lucide` names via `keyof typeof iconMap`.
4. If you need to keep the current inline glyphs alongside the new library, split the component so it either renders `icons[name]` (legacy) or `<Component />` (Lucide/Tabler) based on a lookup table. Gradually migrate the existing name set by swapping a lookup entry to the new component and deleting the old SVG string.
5. Reuse `ProviderIcon`/`file-icon` sprites unless you want to replace them with the new library as well. In that case you can generate SVG sprites from Lucide/Tabler glyphs and keep the same `<use>` URLs, but be mindful of the build step that produces `sprite.svg`.

Keep this doc in sync if you change the icon tooling or regenerate sprites so the next person knows where to look.
