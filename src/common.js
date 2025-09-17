/* eslint-disable no-console */
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// ---------- shell & io ----------
const run = (cmd) =>
  new Promise((resolve) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: String(stdout || ""), stderr: String(stderr || ""), err });
    });
  });

function readAllStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
}

async function readWatchlistText(watchArg) {
  if (!watchArg || watchArg === "-") return await readAllStdin();
  const abs = path.resolve(process.cwd(), watchArg);
  return fs.readFileSync(abs, "utf8");
}

// ---------- watchlist parsing ----------
function parseWatchlist(text) {
  const lines = text.split(/\r?\n/);
  const map = new Map(); // name -> Set(versions) (empty => any version)
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const parts = line.split(",").map((s) => s.trim()).filter(Boolean);
    let currentName = null;

    for (let chunk of parts) {
      chunk = chunk.replace(/\s+/g, " ").trim();
      const atIdx = chunk.lastIndexOf("@");
      const looksScoped = chunk.startsWith("@") && chunk.includes("/");
      const hasAtVersion = atIdx > 0 && (!looksScoped || atIdx > chunk.indexOf("/"));

      let name = null, version = null;

      if (hasAtVersion) {
        name = chunk.slice(0, atIdx).trim();
        version = chunk.slice(atIdx + 1).trim();
      } else {
        const mSpace = chunk.match(/^(@?[^@\s/]+\/[^@\s]+|@?[^@\s]+)\s+([\w.\-]+)$/);
        if (mSpace) { name = mSpace[1].trim(); version = mSpace[2].trim(); }
        else {
          const onlyVersion = chunk.match(/^@?([\w.\-]+)$/);
          if (onlyVersion && currentName) { name = currentName; version = onlyVersion[1].trim(); }
          else {
            const onlyName = chunk.match(/^(@?[^@\s/]+\/[^@\s]+|@?[^@\s]+)$/);
            if (onlyName) name = onlyName[1].trim(); else continue; // ignore garbage line
          }
        }
      }
      if (!name) continue;
      currentName = name;
      if (!map.has(name)) map.set(name, new Set());
      if (version) map.get(name).add(version);
    }
  }
  return map;
}
const isWatched = (watchMap, name, version) =>
  watchMap.has(name) && (watchMap.get(name).size === 0 || watchMap.get(name).has(version));

const nodeId = (name, version) => `${name}@${version}`;

// ---------- traversals (npm-only) ----------
function traverseFromTop(topName, topMeta, watchMap, onMatch) {
  const topVer = topMeta?.version;
  if (!topVer) return;

  const root = { name: topName, version: topVer };
  const pathStack = [root];

  if (isWatched(watchMap, topName, topVer)) onMatch({ root, path: [...pathStack] });

  function dfs(meta, stack) {
    const deps = meta?.dependencies || {};
    for (const [name, child] of Object.entries(deps)) {
      const ver = child?.version;
      if (!ver) continue;

      const next = { name, version: ver };
      const nextStack = [...stack, next];

      if (isWatched(watchMap, name, ver)) onMatch({ root, path: nextStack });
      dfs(child, nextStack);
    }
  }
  dfs(topMeta, pathStack);
}

async function findGlobalMatchesWithTrace(watchMap) {
  const r = await run("npm ls -g --all --json");
  if (!r.stdout) return [];
  let tree; try { tree = JSON.parse(r.stdout); } catch { return []; }

  const matches = [];
  const seen = new Set();
  const tops = tree?.dependencies || {};
  for (const [topName, topMeta] of Object.entries(tops)) {
    traverseFromTop(topName, topMeta, watchMap, ({ root, path }) => {
      const trace = path.map(n => nodeId(n.name, n.version)).join(" > ");
      const key = `npm|global|${nodeId(root.name, root.version)}|${trace}`;
      if (seen.has(key)) return; seen.add(key);
      matches.push({ manager: "npm", root: nodeId(root.name, root.version), trace });
    });
  }
  return matches;
}

async function findProjectMatchesWithTrace(watchMap) {
  const r = await run("npm ls --all --json");
  if (!r.stdout) return [];
  let tree; try { tree = JSON.parse(r.stdout); } catch { return []; }

  const matches = [];
  const seen = new Set();
  const tops = tree?.dependencies || {};
  for (const [topName, topMeta] of Object.entries(tops)) {
    traverseFromTop(topName, topMeta, watchMap, ({ root, path }) => {
      const trace = path.map(n => nodeId(n.name, n.version)).join(" > ");
      const key = `npm|local|${nodeId(root.name, root.version)}|${trace}`;
      if (seen.has(key)) return; seen.add(key);
      matches.push({ manager: "npm", root: nodeId(root.name, root.version), trace });
    });
  }
  return matches;
}
/** Resolve bundled alias to an absolute file path.
 *  Supported forms:
 *   - @bundled/<name>    (adds .txt if missing)
 *   - bundled:<name>     (adds .txt if missing)
 */
function resolveBundledWatchlistPath(arg) {
  if (!arg) return null;

  if (arg.startsWith("@bundled/")) {
    const name = arg.slice("@bundled/".length);
    const fname = name.endsWith(".txt") ? name : `${name}.txt`;
    // package root = ../ from src/, then /watchlists
    return path.join(__dirname, "..", "watchlists", fname);
  }

  if (arg.startsWith("bundled:")) {
    const name = arg.slice("bundled:".length);
    const fname = name.endsWith(".txt") ? name : `${name}.txt`;
    return path.join(__dirname, "..", "watchlists", fname);
  }

  return null;
}

async function readWatchlistText(watchArg) {
  if (!watchArg || watchArg === "-") {
    return await readAllStdin();
  }

  // 1) Alias @bundled/<file> o bundled:<file>
  const bundledPath = resolveBundledWatchlistPath(watchArg);

  // 2) Si no es alias, resolvemos relativo al CWD
  const targetPath = bundledPath || path.resolve(process.cwd(), watchArg);

  try {
    return fs.readFileSync(targetPath, "utf8");
  } catch (e) {
    // Mensaje claro si falló un alias
    if (bundledPath) {
      console.error(
        `Bundled watchlist not found: ${targetPath}\n` +
        `Make sure the file exists under "watchlists/" in the package.`
      );
    } else {
      console.error(`Watchlist file not found: ${targetPath}`);
    }
    process.exit(1);
  }
}

module.exports = {
  readWatchlistText,
  parseWatchlist,
  findGlobalMatchesWithTrace,
  findProjectMatchesWithTrace
};
