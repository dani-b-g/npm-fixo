# npm-fiso

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Scan **npm dependencies** (both **toplevel** and **transitive**) against a **watchlist**, and print **where each match appears**, including the **root package** and a **full trace** down to the affected package.

Supports two modes:

* `globals` — scans globally installed npm packages using `npm ls -g --all --json`
* `project` — scans the current project using `npm ls --all --json`

---

## Features

* Input watchlist from **file** or **STDIN**
* Output results to **file** or **STDOUT**
* Matches by **name** or **exact name\@version**
* Shows the **root package** that contains the match
* Prints the **trace**: `root > … > affected_package`
* Zero runtime dependencies

---

## Install

### Global install

```bash
npm i -g npm-fiso
```

### On the fly (no install)

```bash
npx npm-fiso --help
```

---

## Usage

```
npm-fiso globals [watchlist] [output]
npm-fiso project [watchlist] [output]
npm-fiso -h | --help
```

**Args**

* `watchlist` — path to a text file, or `-` to read from **STDIN**.
  Default: `./watchlist.txt`
* `output` — path to write results, or `-` to write to **STDOUT**.
  Default: `./matches.txt`

**Examples**

```bash
# File -> File
npm-fiso globals ./watchlist.txt ./out-globals.txt
npm-fiso project ./watchlist.txt ./out-project.txt

# STDIN -> STDOUT
cat watchlist.txt | npm-fiso project - -
```

---

## Watchlist format

One entry per line. Accepted forms:

```txt
# exact name@version
angulartics2@14.1.2
@ctrl/ngx-csv@6.0.2

# multiple versions for the same package
@ctrl/tinycolor@4.1.1, @4.1.2
json-rules-engine-simplified@0.2.4, 0.2.1

# name + version separated by space
@nativescript-community/sentry 4.6.43

# name only (any version matches)
ngx-toastr
```

> Lines that don’t parse cleanly (typos, partial words) are ignored.

---

## Output requirements & format

The CLI always prints a header followed by zero or more result lines.

### Header

For **globals**:

```
# Matches (global npm)    root_package    trace_to_affected
```

For **project**:

```
# Matches (project npm)   root_package    trace_to_affected
```

### Result line format

Tab-separated columns:

```
npm    <rootName>@<rootVersion>    <rootName>@<rootVersion> > … > <matchName>@<matchVersion>
```

* **Column 1**: the manager (`npm`)
* **Column 2**: **root\_package** — the top-level package (global install or project dependency) that contains the match
* **Column 3**: **trace\_to\_affected** — full path from the root down to the matched dependency

### Example (project)

```
# Matches (project npm)    root_package    trace_to_affected
npm    ora@8.0.1           ora@8.0.1 > strip-ansi@7.1.0
npm    chalk@5.3.0         chalk@5.3.0 > ansi-styles@6.2.1
```

### No matches

```
## No matches found.
```

---

## How it works (under the hood)

* **Globals**: runs `npm ls -g --all --json`, walks the dependency tree for each globally installed package, and emits a result any time a node matches the watchlist.
* **Project**: runs `npm ls --all --json` in the current directory, walks each **top-level** dependency (whatever is installed in `node_modules`) and all **transitives**, emitting results on matches.
* **Matching rules**:

  * If you specify a **version** in the watchlist → match is **exact** (`name@version`).
  * If you specify **only the name** → **any** installed version matches.

---

## Requirements

* Node.js **>= 14**
* `npm` available on `PATH`
* For `project` mode, ensure the project dependencies are installed:

  ```bash
  npm install   # or: npm ci
  ```

---

## Exit codes

* `0` — ran successfully (matches may or may not have been found)
* `1` — invalid/empty watchlist or fatal execution error

---

## Troubleshooting

* **“Expected package not found”**

  * Verify what npm sees:

    ```bash
    npm ls --all            # in your project
    npm ls -g --all         # global
    ```
  * If your watchlist entry uses `name@version`, the match is **version-exact**. Try just `name` to match any version.

* **Monorepos / large trees**

  * The tool increases stdout buffer to handle large JSON outputs.
  * Run `npm-fiso project` from the **project root** whose `node_modules` you want to analyze.

* **Windows paths**

  * Quote arguments with spaces:

    ```bash
    npm-fiso project "C:\path with spaces\watchlist.txt" "C:\path with spaces\out.txt"
    ```

---

## Development

Local test:

```bash
# from repo root
chmod +x bin/npm-fiso.js
npm link

npm-fiso --help
npm-fiso globals ./watchlist.txt -
npm-fiso project ./watchlist.txt -
```

Pack & publish:

```bash
npm pack
# produces npm-fiso-<version>.tgz

npm login
npm publish --access public
```

---

## License

MIT © Daniel Barriga Grados — see [LICENSE](./LICENSE) for details.
