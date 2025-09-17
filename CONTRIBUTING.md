# Contributing to npm-fiso

## Ground rules
- Use PRs; no direct pushes to `main`.
- Keep branches small and focused: `feature/<slug>`, `fix/<slug>`, `docs/<slug>`.
- Squash & merge only (GitHub default here).
- Resolve all review comments and CI checks before merging.

## Commit messages
- Prefer **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Scope cuando aplique: `feat(cli): ...`

## PR checklist
- [ ] README/help updated if needed.
- [ ] Changelog entry with importants features.

## Release
- Maintainers bump version and push tag: `npm version <patch|minor|major> && git push --follow-tags`.
- Tags `v*.*.*` trigger publish with npm GitHub Actions.
