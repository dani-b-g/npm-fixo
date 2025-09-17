---
name: "📦 Watchlist request"
about: Propose adding a new bundled watchlist (stored under `watchlist/` with alias `@bundled/<name>`)
title: "[Watchlist] "
labels: ["watchlist", "enhancement"]
assignees: []
---

## 🧾 Summary
<!-- Briefly explain what this watchlist covers and why it should be included. -->

- **Proposed alias (without `.txt`)**: `@bundled/<alias>`
- **Proposed file path**: `watchlist/<alias>.txt`

---

## 📚 Sources & criteria
- **Data source(s)** (links):
  <!-- CVEs, advisories, repos, public lists, articles, etc. -->
- **Selection criteria**:
  <!-- e.g., “Angular-related packages”, “packages with known advisories”, etc. -->
- **Ecosystem/coverage**:
  <!-- npm general, Angular, React, NativeScript, etc. -->

---

## 📄 Watchlist content
> Attach the file or paste a **representative snippet** (max ~50 lines).
> Accepted formats by `npm-fixo`:
> - `name@version`
> - `@scope/package@version`
> - Multiple versions per line (comma-separated): `package@1.2.3, 1.2.4`
> - `name version` (space-separated)
> - Name only (match **any** version)

**Example:**
```txt
ansi-styles
strip-ansi@7.1.0
@ctrl/tinycolor@4.1.1, @4.1.2
@nativescript-community/sentry 4.6.43
````

**Estimated file size**:

<!-- In KB/MB. Ideally < 1 MB. -->

---

## 🔁 Updates & maintenance

* **Update frequency** (if applicable):
* **How it’s generated** (reproducible script/process):

  <!-- If there’s a script, share the command or repo link. -->
* **Owner/contact** (your handle or team):

---

## ✅ Compliance & permissions

* [ ] I confirm the content is **redistributable** (source license/ToS allow bundling).
* [ ] I checked for **duplicates** against existing bundled watchlists.
* [ ] The proposed alias **does not collide** with an existing one (`@bundled/<alias>`).

---

## 🧪 Local validation (optional)

> If you tested with `npm-fixo`, paste a trimmed output.

**Command used:**

```bash
# Examples:
npm-fixo project @bundled/<alias> -
npm-fixo globals @bundled/<alias> -
```

**Output (trimmed):**

```
# Matches (project npm)    root_package    trace_to_affected
npm    chalk@5.3.0         chalk@5.3.0 > ansi-styles@6.2.1
...
```

---

## 📎 Additional notes

