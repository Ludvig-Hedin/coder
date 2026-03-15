---
name: safe-refactor-split-file
description: Use when refactoring a large production file into smaller modules without changing behavior. Enforces incremental extraction, backup creation, compile verification after each step, and explicit stop points between analysis and each extraction.
---

# Safe Refactor - Split Large File Into Modules

Use this skill when the task is to break up a large working file into smaller modules with zero intended behavior change.

## Goal

- Reduce file size and improve maintainability
- Preserve runtime behavior exactly
- Keep the diff easy to review
- Work incrementally, with explicit stop points

## Required inputs

Collect or confirm:

- Target file path
- Approximate file size if relevant
- Whether the user wants only the analysis plan or also the first extraction step

If the target file or desired scope is unclear, stop and ask before editing.

## Hard rules

- Do not change behavior
- No logic changes
- No renaming public exports
- No signature changes
- Do not refactor everything at once
- Work incrementally
- Extract one category at a time
- Create a local backup before edits by copying the file to a sibling `*.backup.*` file
- Do not modify the backup
- Preserve import-order semantics
- Keep side-effect imports working
- Do not introduce circular dependencies
- Verify after each step
- The app must still compile
- No TypeScript errors
- No unused exports
- No cleanup, renaming, formatting pass, hook reordering, or unrelated improvements

## Step 1 - Analyze only

Before writing code, inspect the target file and classify code into:

- UI components
- Hooks
- Utility functions
- Types or interfaces
- Constants
- Side-effect logic

Then produce a split plan with concrete paths, for example:

```text
mobile/components/chat/
  ChatHeader.tsx
  ChatInput.tsx
  MessageList.tsx

mobile/lib/chat/
  types.ts
  utils.ts
  parsers.ts
```

For the analysis output:

- Summarize what the file does
- List the extraction categories
- Explain why each proposed extraction is safe
- Call out risky dependencies, side effects, state coupling, or import-order concerns

Stop after the analysis plan unless the user explicitly asked to continue further.

## Step 2 - Extract one category

After approval, extract only one category, such as:

- Types to `types.ts`
- Utilities to `utils.ts`
- Constants to `constants.ts`

Extraction rules:

- Use identical code where possible; prefer copy/paste over rewrites
- Export moved symbols explicitly
- Update imports in the original file only as needed
- Do not reorder logic in the original file
- Keep public exports unchanged

After the extraction, verify:

- All imports resolve
- No dead code remains
- The original file still behaves the same

Then stop and wait for confirmation before the next extraction.

## Step 3 - Verify after every extraction

After each extraction step:

- Run the relevant compile or typecheck command
- Confirm no TypeScript errors
- Confirm no circular dependency was introduced
- Confirm no runtime assumptions or implicit globals were removed

Report:

- Files touched
- What moved
- Why the move is safe
- Any remaining risk to watch in the next step

## Backup rule

Before the first code change, create a sibling backup named after the source file, for example:

```text
Component.tsx.backup
```

or, if the project already uses a different extension-preserving convention:

```text
Component.backup.tsx
```

Preserve the local convention. Never edit the backup.

## Preferred workflow

1. Read the target file carefully
2. Create the backup
3. Do the analysis only
4. Wait for approval
5. Extract one safe category
6. Verify immediately
7. Wait for approval
8. Repeat until the file is reduced enough

## Forbidden moves

- Broad rewrites
- Opportunistic cleanup
- Renaming for style
- Reformatting unrelated code
- Merging multiple extraction categories into one step
- Changing hook order
- Moving side-effect code without explicit verification

## End state

Aim for:

- Original file reduced to a manageable size, often under 300 to 500 lines when practical
- Clear separation of concerns
- Zero intended behavior change
- Reviewable, incremental diffs

If anything looks risky or unclear, stop and ask before acting.
