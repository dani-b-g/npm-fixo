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
  watchlist   Path to the watchlist file, "-" for STDIN,
              or a bundled alias:
                - @bundled/<name>   (e.g. @bundled/common)
                - bundled:<name>    (e.g. bundled:angular)
              ".txt" is optional and added if missing.
              Default: ./watchlist.txt
  output      Path to the output file, or "-" for STDOUT.
              Default: ./matches.txt

Output format:
  # Matches (global|project npm)\troot_package\ttrace_to_affected
  npm\t<root>@<version>\t<root>@<version> > ... > <match>@<version>

Examples:
  # From a regular file:
  npm-fiso globals ./watchlist.txt ./out.txt

  # Using bundled aliases (file lives in package's watchlists/):
  npm-fiso project @bundled/common -
  npm-fiso globals bundled:angular -

  # Pipe:
  cat watchlist.txt | npm-fiso project - -
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
