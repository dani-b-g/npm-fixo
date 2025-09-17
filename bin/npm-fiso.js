#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const {
  readWatchlistText,
  parseWatchlist,
  findGlobalMatchesWithTrace,
  findProjectMatchesWithTrace
} = require("../src/common");

function printHelp() {
  console.log(`
npm-fiso — scan npm dependencies against a watchlist

Usage:
  npm-fiso globals [watchlist] [output]
  npm-fiso project [watchlist] [output]
  npm-fiso -h | --help

Arguments:
  watchlist   Path to the watchlist file, or "-" for STDIN.
              Default: ./watchlist.txt
  output      Path to the output file, or "-" for STDOUT.
              Default: ./matches.txt

Output format:
  # Matches (global|project npm)    root_package    trace_to_affected
  npm    <root>@<version>    <root>@<version> > ... > <match>@<version>

Examples:
  npm-fiso globals ./watchlist.txt ./out.txt
  cat list.txt | npm-fiso project - -

Bundled watchlists:
  This package includes ready-to-use watchlists under:
    node_modules/npm-fiso/watchlists/

You can pass them as the first argument (watchlist). Examples:

    # Local install (project)
    npm-fiso project ./node_modules/npm-fiso/watchlists/<file>.txt -

    # Global install (bash/zsh)
    WATCHLIST="$(npm root -g)/npm-fiso/watchlists/<file>.txt"
    npm-fiso globals "$WATCHLIST" -

    # Cross-platform (compute absolute path at runtime)
    node -p "require('path').join(require('path').dirname(require.resolve('npm-fiso/package.json')), 'watchlists', '<file>.txt')"
`);
}

(async function main() {
  const [,, cmd, watchArg = "./watchlist.txt", outArg = "./matches.txt"] = process.argv;

  if (!cmd || cmd === "-h" || cmd === "--help") {
    printHelp();
    process.exit(0);
  }
  if (!["globals", "project"].includes(cmd)) {
    console.error(`Unknown command: ${cmd}\n`);
    printHelp();
    process.exit(1);
  }

  const watchText = await readWatchlistText(watchArg);
  if (!watchText || !watchText.trim()) {
    console.error('Watchlist is empty. Provide a file or use STDIN (watchlist = "-").');
    process.exit(1);
  }
  const watchMap = parseWatchlist(watchText);

  const runScan = cmd === "globals" ? findGlobalMatchesWithTrace : findProjectMatchesWithTrace;
  const matches = await runScan(watchMap);

  const header = cmd === "globals"
    ? "# Matches (global npm)\troot_package\ttrace_to_affected"
    : "# Matches (project npm)\troot_package\ttrace_to_affected";

  const lines = [header];
  if (!matches.length) {
    lines.push("## No matches found.");
  } else {
    matches.sort((a, b) => (a.root + a.trace).localeCompare(b.root + b.trace));
    for (const m of matches) lines.push(`npm\t${m.root}\t${m.trace}`);
  }

  if (outArg === "-") {
    console.log(lines.join("\n"));
  } else {
    const outPath = path.resolve(process.cwd(), outArg);
    fs.writeFileSync(outPath, lines.join("\n"), "utf8");
    console.log(`Done. Output written to: ${outPath}`);
  }
})();
