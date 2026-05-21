#!/usr/bin/env node
/**
 * CSV → public/data.json
 *
 * Usage: node scripts/build-data.js
 *
 * Reads:
 *   "Seed Treatments.csv"               — ingredient reference (type codes)
 *   "Seed Treatments - APPRIL data.csv" — EPA product registrations
 *
 * Outputs: public/data.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// APPRIL ingredient name → canonical reference name.
// Extend this when annual update reveals new mismatches (check the WARNING log below).
// Note: these are matched by norm(), so can be somewhat flexible in formatting,
// but should be unique after norm() to avoid accidentally aliasing multiple entries together.
const ALIAS_MAP = {
  // "Metalaxyl M": "Mefenoxam",
  // "Metalaxyl-M": "Mefenoxam",
};

function strip(s) {
  return (s ?? '').trim();
}

function norm(name) {
  // Strip CAS registry numbers like " (129121/120068-37-3)" and concentration like " - (41%)"
  return strip(name)
    .replace(/\s*\([\d/-]+\)\s*-?\s*/g, '')
    .replace(/\s*-\s*\(\d+%\)\s*/g, '')
    .trim()
    .toLowerCase();
}

// Loose normalize: lowercase + remove all non-alphanumeric chars + collapse spaces.
// Used to find names that differ only in punctuation, capitalization, or spacing.
function looseNorm(name) {
  return norm(name)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Standard Levenshtein edit distance.
function editDistance(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// ── Reference table ──────────────────────────────────────────────────────────

const DATA_DIR = join(ROOT, 'data');

const refCsv = readFileSync(join(DATA_DIR, 'Seed Treatments.csv'), 'utf8').replace(/^﻿/, '');

const { data: refRows, errors: refErrors } = Papa.parse(refCsv, {
  header: true,
  skipEmptyLines: true,
});

if (refErrors.length) {
  console.warn('Reference CSV parse warnings:', refErrors.slice(0, 5));
}

// refNames: canonical display name for each entry (keyed by norm())
const refNames = new Map(); // norm → display name
const refMap = new Map(); // norm → entry object
for (const row of refRows) {
  const name = strip(row['Seed Treatment']);
  if (!name) continue;
  const entry = {
    name,
    primaryType: strip(row['Type of treatment - Primary']) || null,
    secondaryType: strip(row['Secondary type']) || null,
    notes: strip(row['AKA/Notes']),
  };
  refMap.set(norm(name), entry);
  refNames.set(norm(name), name);
}

// Register aliases so APPRIL names resolve to the same entry
for (const [apprilName, refName] of Object.entries(ALIAS_MAP)) {
  const entry = refMap.get(norm(refName));
  if (entry) refMap.set(norm(apprilName), entry);
}

console.log(`Reference table: ${refMap.size} entries`);

// ── APPRIL product table ──────────────────────────────────────────────────────

const apprilCsv = readFileSync(join(DATA_DIR, 'Seed Treatments - APPRIL data.csv'), 'utf8').replace(
  /^﻿/,
  '',
);

const { data: apprilRows, errors: apprilErrors } = Papa.parse(apprilCsv, {
  header: true,
  skipEmptyLines: true,
});

if (apprilErrors.length) {
  console.warn('APPRIL CSV parse warnings:', apprilErrors.slice(0, 5));
}

console.log(`APPRIL rows: ${apprilRows.length}`);

const unmatched = new Set();
const seenApprilNames = new Set(); // every ingredient name seen across ALL active rows
const companyNameToNums = new Map(); // company name → Set<companyNum>
let skipped = 0;
const products = [];

for (const row of apprilRows) {
  // Keep only active registrations
  // if (strip(row['Status Group']) !== 'Active') {
  // 	skipped++;
  // 	continue;
  // }

  // Split embedded-newline multi-value fields
  const ingredientNames = (row['Active Ingredients'] ?? '')
    .split('\n')
    .map((s) => strip(s).replace(/,+$/, ''))
    .filter(Boolean);

  const crops = (row['Crops'] ?? '').split('\n').map(strip).filter(Boolean);

  const companyName = strip(row['Company Name']);
  const companyNum = strip(row['Company Number']);
  if (companyName) {
    if (!companyNameToNums.has(companyName)) companyNameToNums.set(companyName, new Set());
    if (companyNum) companyNameToNums.get(companyName).add(companyNum);
  }

  const ingredients = ingredientNames.map((name) => {
    seenApprilNames.add(name);
    const ref = refMap.get(norm(name));
    if (!ref) unmatched.add(name);
    return {
      name,
      primaryType: ref?.primaryType ?? null,
      secondaryType: ref?.secondaryType ?? null,
    };
  });

  const primaryTypes = [...new Set(ingredients.map((i) => i.primaryType).filter(Boolean))];

  products.push({
    regNum: strip(row['Registration Number']),
    regType: strip(row['Registration Type']),
    abn: strip(row['ABN']),
    productName: strip(row['Product Name']),
    company: strip(row['Company Name']),
    companyNum: strip(row['Company Number']),
    ingredients,
    ingredientCount: ingredients.length,
    crops,
    primaryTypes,
    status: strip(row['Status']),
    statusGroup: strip(row['Status Group']),
    statusDate: strip(row['Status Date']),
    dateFirstRegistered: strip(row['Date First Registered']),
    latestLabelDate: strip(row['Latest Label Date']),
    pesticideType: strip(row['Pesticide Type']),
    pesticideCategory: strip(row['Pesticide Category']),
    physicalForm: strip(row['Physical Form']),
    signalWord: strip(row['Signal Word']),
    restrictedUse: strip(row['Restricted Use Flag']) === 'Y',
    restrictedUseReason: strip(row['Restricted Use Reason']),
    transferHistory: strip(row['Transfer History']),
    meeToo: strip(row['Similar Product? (Me Too)']),
    notes: strip(row['Notes']),
  });
}

console.log(`Skipped (non-active): ${skipped}`);
console.log(`Output products:      ${products.length}`);

if (unmatched.size > 0) {
  console.warn('\nWARNING — ingredients with no type badge (add to ALIAS_MAP or fix CSV):');
  for (const name of [...unmatched].sort()) {
    console.warn(`  - ${name}`);
  }
} else {
  console.log('All ingredients matched reference table.');
}

mkdirSync(join(ROOT, 'public'), { recursive: true });
writeFileSync(join(ROOT, 'public/data.json'), JSON.stringify(products));
console.log('\nWrote public/data.json');

// ── Fuzzy analysis ────────────────────────────────────────────────────────────

console.log('\n── Fuzzy analysis ──────────────────────────────────────────────');

// 1. Alias map audit
const aliasIssues = [];
for (const [apprilName, refName] of Object.entries(ALIAS_MAP)) {
  const seenInData = [...seenApprilNames].some((n) => norm(n) === norm(apprilName));
  const targetExists = refNames.has(norm(refName));
  if (!seenInData) {
    aliasIssues.push(
      `  ALIAS NEVER HIT: "${apprilName}" → "${refName}" (key not found in APPRIL data)`,
    );
  }
  if (!targetExists) {
    aliasIssues.push(
      `  ALIAS BAD TARGET: "${apprilName}" → "${refName}" (target not in reference table)`,
    );
  }
}
if (aliasIssues.length) {
  console.warn('\nAlias map issues:');
  aliasIssues.forEach((s) => console.warn(s));
} else {
  console.log('Alias map: all entries hit valid targets.');
}

// 2. Loose-norm duplicates within the reference table
// Same after stripping punct/case → almost certainly should be one canonical entry.
const refByLoose = new Map(); // looseNorm → [display names]
for (const [, name] of refNames) {
  const key = looseNorm(name);
  if (!refByLoose.has(key)) refByLoose.set(key, []);
  refByLoose.get(key).push(name);
}
const refLooseDups = [...refByLoose.values()].filter((v) => v.length > 1);
if (refLooseDups.length) {
  console.warn(
    `\nReference table — ${refLooseDups.length} loose-duplicate group(s) (fix the CSV):`,
  );
  for (const group of refLooseDups.sort((a, b) => a[0].localeCompare(b[0]))) {
    console.warn('  ' + group.map((n) => `"${n}"`).join('  vs  '));
  }
} else {
  console.log('Reference table: no loose duplicates.');
}

// 3. Loose-norm duplicates within APPRIL ingredient names
const apprilByLoose = new Map();
for (const name of seenApprilNames) {
  const key = looseNorm(name);
  if (!apprilByLoose.has(key)) apprilByLoose.set(key, []);
  apprilByLoose.get(key).push(name);
}
const apprilLooseDups = [...apprilByLoose.values()].filter((v) => v.length > 1);
if (apprilLooseDups.length) {
  console.warn(`\nAPPRIL data — ${apprilLooseDups.length} loose-duplicate group(s) (fix the CSV):`);
  for (const group of apprilLooseDups.sort((a, b) => a[0].localeCompare(b[0]))) {
    console.warn('  ' + group.map((n) => `"${n}"`).join('  vs  '));
  }
} else {
  console.log('APPRIL data: no loose duplicates within ingredient names.');
}

// 3b. Loose-norm duplicates within APPRIL company names.
// Company number(s) shown in brackets — same number = data-entry inconsistency; different = investigate.
const companyByLoose = new Map();
for (const name of companyNameToNums.keys()) {
  const key = looseNorm(name);
  if (!companyByLoose.has(key)) companyByLoose.set(key, []);
  companyByLoose.get(key).push(name);
}
const companyLooseDups = [...companyByLoose.values()].filter((v) => v.length > 1);
if (companyLooseDups.length) {
  console.warn(
    `\nAPPRIL data — ${companyLooseDups.length} loose-duplicate company name group(s) (fix the CSV):`,
  );
  for (const group of companyLooseDups.sort((a, b) => a[0].localeCompare(b[0]))) {
    const detail = group
      .map((n) => {
        const nums = [...(companyNameToNums.get(n) ?? [])].sort().join(', ');
        return `"${n}"${nums ? ` [#${nums}]` : ''}`;
      })
      .join('  vs  ');
    console.warn('  ' + detail);
  }
} else {
  console.log('APPRIL data: no loose duplicates within company names.');
}

// 4. Cross-file loose matches: APPRIL name ↔ reference name that differ only by punct/case,
//    but are NOT already resolved by an alias or direct match.
const aliasNorms = new Set(Object.keys(ALIAS_MAP).map(norm));
const crossLooseMismatches = [];
for (const apprilName of seenApprilNames) {
  if (refMap.has(norm(apprilName))) continue; // already resolves fine
  const apprilLoose = looseNorm(apprilName);
  for (const [, refDisplayName] of refNames) {
    if (looseNorm(refDisplayName) === apprilLoose) {
      const inAliasMap = aliasNorms.has(norm(apprilName));
      crossLooseMismatches.push({ apprilName, refDisplayName, inAliasMap });
    }
  }
}
if (crossLooseMismatches.length) {
  console.warn(`\nCross-file loose matches — APPRIL vs reference (punct/case only):`);
  for (const { apprilName, refDisplayName, inAliasMap } of crossLooseMismatches.sort((a, b) =>
    a.apprilName.localeCompare(b.apprilName),
  )) {
    const tag = inAliasMap ? ' [already in ALIAS_MAP]' : ' [fix CSV or add alias]';
    console.warn(`  APPRIL: "${apprilName}"  →  ref: "${refDisplayName}"${tag}`);
  }
} else {
  console.log('Cross-file: no loose punct/case mismatches.');
}

// 5. Fuzzy (Levenshtein) near-misses: unmatched APPRIL names vs reference names,
//    where edit distance ≤ threshold. Excludes anything already caught by loose matching.
//    Threshold: 2 edits for short names, 3 for longer ones.
const alreadyLooseMatched = new Set(crossLooseMismatches.map((m) => norm(m.apprilName)));
const fuzzyThreshold = (a, b) => {
  const longer = Math.max(a.length, b.length);
  return longer <= 10 ? 2 : longer <= 20 ? 3 : 4;
};

const fuzzyHits = [];
const refNormList = [...refNames.entries()]; // [[normKey, displayName], ...]

for (const apprilName of [...unmatched].sort()) {
  if (alreadyLooseMatched.has(norm(apprilName))) continue;
  const aN = norm(apprilName);
  for (const [rNormKey, rDisplayName] of refNormList) {
    const dist = editDistance(aN, rNormKey);
    if (dist > 0 && dist <= fuzzyThreshold(aN, rNormKey)) {
      fuzzyHits.push({ apprilName, rDisplayName, dist });
    }
  }
}
if (fuzzyHits.length) {
  console.warn(`\nFuzzy near-misses (unmatched APPRIL names close to a reference entry):`);
  for (const { apprilName, rDisplayName, dist } of fuzzyHits.sort(
    (a, b) => a.dist - b.dist || a.apprilName.localeCompare(b.apprilName),
  )) {
    console.warn(`  [dist=${dist}] APPRIL: "${apprilName}"  →  ref: "${rDisplayName}"`);
  }
} else {
  console.log('No fuzzy near-misses in unmatched APPRIL ingredients.');
}
