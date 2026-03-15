# Sidebar Thread List Redesign

## Status

- Date: 2026-03-15
- Scope: `packages/app`
- State: implemented

## Goal

Replace the existing desktop sidebar pattern with a single-column thread list layout that matches the provided reference more closely.

## User-facing changes

- Replaced the old project rail + project detail panel with one integrated sidebar.
- Added a top-level `New thread` action.
- Grouped sessions under project folder rows in a thread-list layout.
- Moved `Settings` to a persistent action at the bottom of the sidebar.
- Removed the sidebar help action and provider getting-started card from the sidebar surface.
- Removed automation and skills entries because the app does not support them yet.
- Tightened spacing and reduced left indent on thread rows so thread titles align more closely with project labels.
- Added a persistent unread-dot slot for thread rows so titles stay aligned whether or not a thread is unread.
- Restored desktop sidebar resizing with a minimum width.
- Sidebar visibility remains controlled by the titlebar sidebar button and `cmd+b`.

## Architectural notes

- The new sidebar is rendered by `packages/app/src/pages/layout/sidebar-thread-list.tsx`.
- Routing and session opening still rely on existing project/session state from `layout.tsx`, `global-sync`, and `server.projects`.
- Recent project directories shown in the sidebar are preloaded from `layout.tsx` so the thread list can request session data for the folders it displays.
- Session rows reuse existing session metadata:
  - title
  - updated time
  - summary additions/deletions
  - archive action
- Desktop width is stored in existing persisted sidebar state and resized through the shared `ResizeHandle`.

## Known gap versus reference

- The reference shows more top-level navigation items and control affordances than the app currently supports.
- Automation and skills were intentionally omitted.
- The top window-control treatment from the reference was not duplicated because this app already has a separate titlebar.
- Full live verification of populated thread rows depends on a working local session backend. In the current Vite-only check, the sidebar shell renders correctly but session streaming is unavailable.

## Rationale

- User-facing: the sidebar now reads as a thread browser instead of a split navigation shell.
- Architectural: the redesign is isolated in a new sidebar component so later refinements can happen without rewriting session routing or sync state.
