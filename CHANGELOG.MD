# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2025-09-18
### Added
- **Bundled watchlist aliases**: you can pass `@bundled/<name>` or `bundled:<name>` (with optional `.txt`) as the `watchlist` argument and it resolves to the package’s bundled list.
- **README – Bundled watchlists section**: added a table listing the shipped watchlist(s) and direct link to the file in the repo.
  - Current entry: `watchlist/npm_160925.txt` → linked in README.
- **CLI help** now documents bundled aliases and usage examples for both modes.

### Docs
- English-first README with clear usage, input/output requirements, examples, and troubleshooting.

---

## [1.0.0] - 2025-09-18
### Added
- **CLI `npm-fiso`** with two subcommands:
  - `globals`: scans global npm dependencies using `npm ls -g --all --json`.
  - `project`: scans the current project using `npm ls --all --json`.
- **Full tree traversal** (toplevel + transitivas) and **trace output**:
  - Output includes the **root package** and the **trace**:  
    `root@version > … > matched@version`.
- **Watchlist parser**:
  - Supports `name@version`, multiple versions per line separated by commas, `name version` (space), and name-only (match any version).
- **I/O**:
  - Watchlist from **file** or **STDIN** (`-`).
  - Results to **file** or **STDOUT** (`-`).
- **Packaging**:
  - `bin/npm-fiso.js` as executable.
  - Whitelisted files for npm publish (`bin`, `src`, `README.md`, `LICENSE`, y la carpeta `watchlist/`).
  - `engines: { "node": ">=14" }`.

### Changed
- **License** switched to **MIT**.

---

[1.1.0]: https://github.com/dani-b-g/npm-fiso/compare/v1.0.0...v1.1.0