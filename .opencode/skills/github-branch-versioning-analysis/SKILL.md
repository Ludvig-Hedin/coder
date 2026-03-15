---
name: github-branch-versioning-analysis
description: Use when auditing a repository's current git branch structure, naming patterns, releases, and versioning approach before proposing a cleaner branching and release strategy. Focus on showing the current state first, then recommending improvements.
---

# GitHub Branch Organization & Versioning Analysis

Use this skill when the user wants to understand the current git and GitHub branch setup, then define a more organized branching and release model.

## Goal

- Show the current state first
- Audit local and remote branch structure
- Identify how versioning currently works, if at all
- Recommend a cleaner branching, tagging, and release process

## Investigation workflow

Start with the current state before making recommendations.

### Check local and remote git state

- Run `git branch -a`
- Inspect current branch naming patterns
- Review recent commit history for naming and release habits
- Check tags if they exist
- Review remotes and any visible release branches

If GitHub access is available, also inspect the remote repository branch structure and release setup. If it is not available, say so clearly and continue with the local audit.

## Recommended branch strategy

When proposing improvements, use this structure unless the repo already has a stronger convention:

- `feature/YYYY-MM-DD-short-description`
- `fix/YYYY-MM-DD-issue-description`
- `release/v1.x.x`

Examples:

- `feature/2025-05-31-profile-forms`
- `fix/2025-05-31-auth-cookies`

## Recommended versioning model

Use semantic versioning unless the repo already has a justified alternative.

- `v1.0.0`: stable MVP milestone
- `v1.1.0`: additive feature increment
- `v1.x.x`: future additive feature increments

If the current state is not stable enough for `v1.0.0`, say so and explain what is missing.

## Documentation and release guidance

Recommend:

- tagging working milestones with date and description
- maintaining `CHANGELOG.md` with explicit versions
- creating GitHub releases for major milestones
- enabling branch protection rules for `main`

## Output structure

Return results in this order:

1. Current branch and versioning state
2. Risks or inconsistencies in the current model
3. Recommended branching strategy
4. Recommended release/versioning approach
5. Suggested automation or workflow improvements

## Task boundaries

By default, this skill is analysis-only.

Do not create branches, tags, releases, workflows, or protection rules unless the user explicitly asks for implementation after the audit.

If the user does ask for implementation:

- describe the exact changes first
- keep branch and tag operations explicit and reversible where possible
- avoid modifying release history without confirmation
