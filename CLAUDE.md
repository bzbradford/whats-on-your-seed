# What's on Your Seed — Claude guidance

## Project overview

A static Svelte 5 SPA that replaces a PDF with a searchable seed treatment database. It is embedded as an `<iframe>` on extension.wisc.edu (WordPress). No backend; data is baked into `public/data.json` at build time from two CSV source files.

## Commands

```bash
npm run build:data   # CSV → public/data.json (run after any CSV change)
npm run dev          # Vite dev server with HMR
npm run build        # Production build → dist/
npm run format       # Prettier (formats .svelte, .ts, .css)
```

## Key files

- `src/App.svelte` — all app state, filtering/sorting logic, column definitions
- `src/lib/types.ts` — `Product`, `Ingredient`, `ColDef` interfaces; update when adding data fields
- `src/lib/components/DataTable.svelte` — generic sortable table; accepts a `cell` snippet from the parent
- `scripts/build-data.js` — CSV→JSON pipeline; has `ALIAS_MAP` for ingredient name mismatches
- `data/*.csv` — source of truth; never hand-edit `public/data.json`

## Architecture decisions

**No backend.** Data (~150 KB JSON) is read-only and updated annually. `fetch('/data.json')` loads it at runtime.

**iframe embed.** The widget must be self-contained with no CSS/JS leaking to the host page. Don't add `<link>` tags that load external fonts or resources.

**Svelte 5 runes.** Use `$state`, `$derived`, `$derived.by`, `$props`. Do not use legacy Svelte 4 syntax (`$:`, `export let`, stores). Snippet parameters should be explicitly typed.

**Generic DataTable.** `DataTable.svelte` uses `generics="TRow"` so `rowKey` and the `cell` snippet infer the row type from `rows`. When changing the component, keep the Props interface generic.

**Column system.** Columns are defined in `ALL_COLUMNS: ColDef[]` in `App.svelte`. Cell rendering is a single `{#snippet cell(col: ColDef, product: Product)}` switch on `col.key`. Adding a column = one entry in `ALL_COLUMNS` + one `{:else if}` branch in the snippet.

**TypeScript strict mode.** `tsconfig.json` has `"strict": true`. Use `as unknown as T` for necessary unsafe casts (e.g., dynamic property access on `Product`). Don't use `@ts-ignore`; fix the types instead.

## Data pipeline

The build script (`scripts/build-data.js`) is plain Node ESM with PapaParse. It:
1. Parses both CSVs (handles BOM, embedded newlines in quoted fields)
2. Filters APPRIL rows to `Status Group = "Active"`
3. Splits `Active Ingredients` and `Crops` on `\n`
4. Joins ingredient names → reference table via `norm()` (strips CAS numbers, lowercases)
5. Resolves name mismatches via `ALIAS_MAP`
6. Runs fuzzy analysis at the end (alias audit, loose duplicates, Levenshtein near-misses)
7. Writes `public/data.json`

Always run `npm run build:data` and review its output after any CSV change. The fuzzy analysis section surfaces data quality issues that need manual review.

## Type badge colors

F=blue, I=amber, N=green, P=violet, H=red. Defined in `TypeBadge.svelte`'s `CONFIG` object and replicated as Tailwind classes in the type-filter buttons in `App.svelte`. If you change one, change the other.

## What to avoid

- Do not hand-edit `public/data.json`.
- Do not add a server/API — this must stay static.
- Do not use Svelte 4 syntax (stores, `$:`, `export let`).
- Do not add `console.log` calls to production Svelte components.
- Do not use `any` types; use `unknown` + narrowing or proper interfaces.
