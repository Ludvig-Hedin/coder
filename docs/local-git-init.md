# Local Git Init

The app treats `Initialize Git` as a local-only action.

- It initializes a repository in the opened folder.
- It does not create a GitHub repository.
- It does not add or modify remotes.
- It does not authenticate with GitHub.

If a repo has no remote after initialization, the UI shows terminal-first publish commands instead of trying to manage GitHub credentials in-app.
