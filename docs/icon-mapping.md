# Tabler icon migration map

This sheet captures every icon that the `packages/ui` library currently exposes via `Icon`. It links the existing keyword, where it is used today, and the Tabler outline glyph that will replace it.

The migration keeps the `Icon` API unchanged (`name`, `size`, `class`) while switching the drawing surface under the hood to [@tabler/icons](https://www.npmjs.com/package/@tabler/icons). When an icon already has an active/pressed variant (e.g. `terminal` vs `terminal-active`), we will render the same Tabler glyph and rely on `data-` attributes or CSS to reflect the state.

| Current name | Primary usage / purpose | Tabler equivalent |
|---|---|---|
| `align-right` | Not referenced currently | `IconAlignRight` (`align-right`) |
| `arrow-up` | Not referenced currently | `IconArrowUp` (`arrow-up`) |
| `arrow-left` | Not referenced currently | `IconArrowLeft` (`arrow-left`) |
| `arrow-right` | Not referenced currently | `IconArrowRight` (`arrow-right`) |
| `archive` | Not referenced currently | `IconArchive` (`archive`) |
| `bubble-5` | Not referenced currently | `IconMessageCircle` (`message-circle`) |
| `prompt` | Not referenced currently | `IconSparkles` (`sparkles`) |
| `brain` | Not referenced currently | `IconBrain` (`brain`) |
| `fork` | Not referenced currently | `IconGitBranch` (`git-branch`) |
| `bullet-list` | Not referenced currently | `IconList` (`list`) |
| `check-small` | Used in `components/select.tsx` and `components/list.tsx` for checkboxes and multi-select bullets | `IconCheck` (`check`) |
| `chevron-down` | Used for collapsible/session-review toggles and the file-search dropdown arrow | `IconChevronDown` (`chevron-down`) |
| `chevron-left` | Not referenced currently | `IconChevronLeft` (`chevron-left`) |
| `chevron-right` | Not referenced currently | `IconChevronRight` (`chevron-right`) |
| `chevron-grabber-vertical` | Drag handle in `message-part` for resizable message panes | `IconGripVertical` (`grip-vertical`) |
| `chevron-double-right` | Not referenced currently | `IconChevronsRight` (`chevrons-right`) |
| `circle-x` | Not referenced currently | `IconCircleX` (`circle-x`) |
| `close` | Not referenced currently | `IconX` (`x`) |
| `close-small` | Close button inside the file-search chip | `IconX` (`x`) |
| `checklist` | Not referenced currently | `IconListCheck` (`list-check`) |
| `console` | Not referenced currently | `IconTerminal` (`terminal`) |
| `terminal` | Not referenced currently | `IconTerminal` (`terminal`) |
| `terminal-active` | Not referenced currently | `IconTerminal` (`terminal`) |
| `review` | Not referenced currently | `IconClipboardList` (`clipboard-list`) |
| `review-active` | Not referenced currently | `IconClipboardList` (`clipboard-list`) |
| `expand` | Not referenced currently | `IconMaximize` (`maximize`) |
| `collapse` | Not referenced currently | `IconMinimize` (`minimize`) |
| `code` | Not referenced currently | `IconCode` (`code`) |
| `code-lines` | Not referenced currently | `IconCode` (`code`) |
| `circle-ban-sign` | Used in `components/tool-error-card.tsx` to signal disabled tools | `IconBan` (`ban`) |
| `edit-small-2` | Not referenced currently | `IconPencil` (`pencil`) |
| `eye` | Not referenced currently | `IconEye` (`eye`) |
| `enter` | `message-part` uses this to indicate the “open in new pane” action | `IconArrowRightBar` (`arrow-right-bar`) |
| `folder` | Not referenced currently | `IconFolder` (`folder`) |
| `file-tree` | Not referenced currently | `IconFiles` (`files`) |
| `file-tree-active` | Not referenced currently | `IconFiles` (`files`) |
| `magnifying-glass` | Search affordance in the list and file search inputs | `IconSearch` (`search`) |
| `plus-small` | Not referenced currently | `IconPlus` (`plus`) |
| `plus` | Not referenced currently | `IconPlus` (`plus`) |
| `new-session` | Not referenced currently | `IconCalendarPlus` (`calendar-plus`) |
| `new-session-active` | Not referenced currently | `IconCalendarPlus` (`calendar-plus`) |
| `pencil-line` | Not referenced currently | `IconPencil` (`pencil`) |
| `mcp` | Not referenced currently | `IconSparkles` (`sparkles`) |
| `glasses` | Not referenced currently | `IconEyeglass` (`eyeglass`) |
| `magnifying-glass-menu` | Not referenced currently | `IconSearch` (`search`) |
| `window-cursor` | Not referenced currently | `IconCursorText` (`cursor-text`) |
| `task` | Not referenced currently | `IconListCheck` (`list-check`) |
| `stop` | Not referenced currently | `IconSquare` (`square`) |
| `status` | Not referenced currently | `IconActivity` (`activity`) |
| `status-active` | Not referenced currently | `IconActivity` (`activity`) |
| `sidebar` | Not referenced currently | `IconLayoutSidebar` (`layout-sidebar`) |
| `sidebar-active` | Not referenced currently | `IconLayoutSidebar` (`layout-sidebar`) |
| `layout-left` | Not referenced currently | `IconLayoutSidebarLeftExpand` (`layout-sidebar-left-expand`) |
| `layout-left-partial` | Not referenced currently | `IconLayoutSidebarLeftCollapse` (`layout-sidebar-left-collapse`) |
| `layout-left-full` | Not referenced currently | `IconLayoutSidebarLeftExpand` (`layout-sidebar-left-expand`) |
| `layout-right` | Not referenced currently | `IconLayoutSidebarRightExpand` (`layout-sidebar-right-expand`) |
| `layout-right-partial` | Not referenced currently | `IconLayoutSidebarRightCollapse` (`layout-sidebar-right-collapse`) |
| `layout-right-full` | Not referenced currently | `IconLayoutSidebarRightExpand` (`layout-sidebar-right-expand`) |
| `square-arrow-top-right` | Used in `components/message-part.tsx` for the “open externally” control | `IconArrowUpRight` (`arrow-up-right`) |
| `open-file` | Used in `components/session-review.tsx` to mark the active file | `IconFile` (`file`) |
| `speech-bubble` | Not referenced currently | `IconMessageCircle` (`message-circle`) |
| `comment` | Not referenced currently | `IconMessageCircle` (`message-circle`) |
| `folder-add-left` | Not referenced currently | `IconFolderPlus` (`folder-plus`) |
| `github` | Not referenced currently | `IconBrandGithub` (`brand-github`) |
| `discord` | Not referenced currently | `IconBrandDiscord` (`brand-discord`) |
| `layout-bottom` | Not referenced currently | `IconLayoutBottombar` (`layout-bottombar`) |
| `layout-bottom-partial` | Not referenced currently | `IconLayoutBottombarCollapse` (`layout-bottombar-collapse`) |
| `layout-bottom-full` | Not referenced currently | `IconLayoutBottombarExpand` (`layout-bottombar-expand`) |
| `dot-grid` | Not referenced currently | `IconGridDots` (`grid-dots`) |
| `circle-check` | Not referenced currently | `IconCircleCheck` (`circle-check`) |
| `copy` | Not referenced currently | `IconCopy` (`copy`) |
| `check` | Checkbox/icon stories demonstrate this glyph | `IconCheck` (`check`) |
| `photo` | Not referenced currently | `IconPhoto` (`photo`) |
| `share` | Not referenced currently | `IconShare` (`share`) |
| `shield` | Not referenced currently | `IconShield` (`shield`) |
| `download` | Not referenced currently | `IconDownload` (`download`) |
| `menu` | Not referenced currently | `IconMenu` (`menu`) |
| `server` | Not referenced currently | `IconServer` (`server`) |
| `branch` | Not referenced currently | `IconGitBranch` (`git-branch`) |
| `edit` | Not referenced currently | `IconPencil` (`pencil`) |
| `help` | Not referenced currently | `IconHelpCircle` (`help-circle`) |
| `settings-gear` | Not referenced currently | `IconSettings` (`settings`) |
| `dash` | Not referenced currently | `IconMinus` (`minus`) |
| `cloud-upload` | Not referenced currently | `IconCloudUpload` (`cloud-upload`) |
| `trash` | Not referenced currently | `IconTrash` (`trash`) |
| `sliders` | Not referenced currently | `IconAdjustments` (`adjustments`) |
| `keyboard` | Not referenced currently | `IconKeyboard` (`keyboard`) |
| `selector` | Not referenced currently | `IconSelector` (`selector`) |
| `arrow-down-to-line` | Not referenced currently | `IconArrowDown` (`arrow-down`) |
| `warning` | Not referenced currently | `IconAlertCircle` (`alert-circle`) |
| `reset` | Not referenced currently | `IconRefresh` (`refresh`) |
| `link` | Not referenced currently | `IconLink` (`link`) |
| `providers` | Not referenced currently | `IconLayoutGrid` (`layout-grid`) |
| `models` | Not referenced currently | `IconLayersLinked` (`layers-linked`) |

## Notes

- A small subset of glyphs are still used in stories/build tooling (`check`, `chevron-down`, `circle-ban-sign`, etc.); they keep their new Tabler partners unchanged.
- Active/“highlighted” pairs (e.g. `terminal-active`, `status-active`, `sidebar-active`) will continue to render the same Tabler outline and rely on `data-active` hooks for styling.
- The Tabler assets live under `node_modules/@tabler/icons/icons/outline`; the generated snippets file slices out the inner `<path>` content so `Icon` can reuse our existing wrapper.
