# What's on Your Seed?

A searchable, iframe-embeddable web widget for the UW–Madison NPM Program's seed treatment database. Replaces the static PDF (`UW-NPM-Whats-on-your-seed.pdf`) with a live, filterable table of EPA-registered seed treatment products for corn, soybean, small grains, alfalfa, and cotton.

**Authors:** Mikael Geiziter, Jordan Scholar & Mimi Broeske (NPM Program); Damon Smith (Plant Pathology). Published at ipcm.wisc.edu.

---

## Quick start

```bash
# 1. Generate the data file from the source CSVs
npm run build:data

# 2. Start the dev server
npm run dev

# 3. Production build → dist/
npm run build
```

---

## Project structure

```
whats-on-your-seed/
├── data/                          # Source-of-truth CSV files (never hand-edit)
│   ├── Seed Treatments.csv        # Ingredient reference table (type codes)
│   └── Seed Treatments - APPRIL data.csv   # EPA product registrations
│
├── public/
│   └── data.json                  # Generated — do not edit (output of build:data)
│
├── scripts/
│   └── build-data.js              # CSV → JSON pipeline (Node, runs with build:data)
│
├── src/
│   ├── App.svelte                 # Root component: search, filters, table, dialog
│   ├── app.css                    # Tailwind v4 entry point + custom theme vars
│   ├── main.ts                    # Vite/Svelte mount point
│   └── lib/
│       ├── types.ts               # Shared TypeScript interfaces (Product, ColDef, …)
│       ├── utils.ts               # cn() utility (clsx + tailwind-merge)
│       └── components/
│           ├── DataTable.svelte   # Generic sortable table with Svelte snippet columns
│           ├── DetailDialog.svelte # bits-ui Dialog: full product detail
│           └── TypeBadge.svelte   # Color-coded F/I/N/P/H treatment type badges
│
├── index.html
├── vite.config.js
├── tsconfig.json
└── package.json
```

---

## Scripts

| Command              | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| `npm run build:data` | Parse CSVs → `public/data.json`. Run this whenever source data changes. |
| `npm run dev`        | Start Vite dev server (hot reload).                                     |
| `npm run build`      | Production build → `dist/`.                                             |
| `npm run preview`    | Serve the production build locally.                                     |
| `npm run format`     | Auto-format all files with Prettier.                                    |
| `npm run lint`       | Check formatting without writing.                                       |

---

## Annual data update

1. Drop the new CSV files into `data/` (keep the same filenames).
2. Run `npm run build:data` and review the console output:
   - **Unmatched ingredients** — ingredients in APPRIL with no type badge. Fix by editing the CSVs or adding an entry to `ALIAS_MAP` in `scripts/build-data.js`.
   - **Alias map issues** — alias keys that were never encountered, or whose target doesn't exist in the reference table.
   - **Loose duplicates** — names that are identical after stripping punctuation/case (e.g. `3 LB Copper` vs `3 Lb. Copper`). Fix in the CSVs.
   - **Fuzzy near-misses** — names close in edit distance; review to see if they should be the same entry.
3. Verify row counts look reasonable against the previous year's output.
4. Run `npm run build` and deploy `dist/`.

### Alias map

`ALIAS_MAP` in `scripts/build-data.js` maps APPRIL ingredient names to their canonical name in the reference table, for cases where EPA uses a different name than the reference CSV. Add entries here only when fixing the CSV isn't practical.

---

## Data model

Data comes from **two CSVs** that are joined during the build step.

### `Seed Treatments.csv` — ingredient reference table

One row per active ingredient. Provides the **type code** (F/I/N/P/H) that drives the color badges. Key columns:

| Column                                                 | Notes                                                                       |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `Seed Treatment`                                       | Ingredient name (join key)                                                  |
| `Type of treatment - Primary`                          | F, I, N, P, or H                                                            |
| `Secondary type`                                       | Optional secondary type code                                                |
| `Alfalfa`, `Corn`, `Cotton`, `Small Grains`, `Soybean` | TRUE if registered for that crop                                            |
| `AKA/Notes`                                            | Known alternate names (informal; use `ALIAS_MAP` for programmatic aliasing) |

### `Seed Treatments - APPRIL data.csv` — EPA product registrations

One row per product registration (~615 rows, ~592 active). Key columns:

| Column                | Notes                                                          |
| --------------------- | -------------------------------------------------------------- |
| `Registration Number` | EPA reg #; not unique — multiple trade names can share a reg # |
| `Active Ingredients`  | **Newline-separated** within the quoted field; split on `\n`   |
| `Product Name`        | Trade name (may include ® / ™)                                 |
| `Crops`               | **Newline-separated** within the quoted field                  |
| `Status Group`        | Filter to `Active` only                                        |
| `Status`              | `Registered`, `Conditionally Registered`, etc.                 |

The build script filters to `Status Group = "Active"`, splits multi-value fields, joins to the reference table by ingredient name, and writes a flat JSON array to `public/data.json`.

### Type codes

| Code | Treatment type         | Badge color |
| ---- | ---------------------- | ----------- |
| F    | Fungicide              | Blue        |
| I    | Insecticide            | Amber       |
| N    | Nematicide             | Green       |
| P    | Plant Growth Regulator | Violet      |
| H    | Herbicide              | Red         |

---

## Adding or removing table columns

Column definitions live in `ALL_COLUMNS` in `src/App.svelte`. Each entry is a `ColDef`:

```ts
{ key: 'company', label: 'Company', sortable: true, tdClass: 'text-gray-600 text-xs' }
```

- `key` must match a field name on the `Product` type in `src/lib/types.ts`.
- `sortable: true` adds a clickable sort button to the header.
- `tdClass` / `thClass` are extra Tailwind classes applied to the cells/header.

Cell rendering is defined in a single `{#snippet cell(col, product)}` block in `App.svelte`. Add a new `{:else if col.key === 'yourKey'}` branch there to render a new column.

The `visibleColumnKeys` state array controls which columns are currently shown. A column picker UI can toggle this at runtime.

---

## Embedding as an iframe

```html
<iframe
  src="https://your-deploy-url/"
  width="100%"
  height="800"
  style="border:none;"
  title="What's on Your Seed? Seed Treatment Database"
></iframe>
```

The widget is a self-contained static SPA with no server-side dependencies. Deploy the contents of `dist/` to any static host (GitHub Pages, Netlify, a UW web server, etc.).

---

## Tech stack

| Layer         | Choice                                      |
| ------------- | ------------------------------------------- |
| Framework     | Svelte 5 (runes API)                        |
| Build tool    | Vite 8                                      |
| Styling       | Tailwind CSS v4 (`@tailwindcss/vite`)       |
| UI primitives | bits-ui 2.x (Dialog)                        |
| Icons         | lucide-svelte                               |
| Type checking | TypeScript (strict) + svelte-check          |
| CSV parsing   | PapaParse (build script only)               |
| Data          | Static JSON baked at build time; no backend |
