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
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// APPRIL ingredient name → canonical reference name.
// Extend this when annual update reveals new mismatches (check the WARNING log below).
const ALIAS_MAP = {
  "Metalaxyl M": "Mefenoxam",
  "Metalaxyl-M": "Mefenoxam",
};

function strip(s) {
  return (s ?? "").trim();
}

function norm(name) {
  // Strip CAS registry numbers like " (129121/120068-37-3)" and concentration like " - (41%)"
  return strip(name)
    .replace(/\s*\([\d/-]+\)\s*-?\s*/g, "")
    .replace(/\s*-\s*\(\d+%\)\s*/g, "")
    .trim()
    .toLowerCase();
}

// ── Reference table ──────────────────────────────────────────────────────────

const DATA_DIR = join(ROOT, "data");

const refCsv = readFileSync(join(DATA_DIR, "Seed Treatments.csv"), "utf8").replace(
  /^﻿/,
  "",
);

const { data: refRows, errors: refErrors } = Papa.parse(refCsv, {
  header: true,
  skipEmptyLines: true,
});

if (refErrors.length) {
  console.warn("Reference CSV parse warnings:", refErrors.slice(0, 5));
}

const refMap = new Map();
for (const row of refRows) {
  const name = strip(row["Seed Treatment"]);
  if (!name) continue;
  refMap.set(norm(name), {
    name,
    primaryType: strip(row["Type of treatment - Primary"]) || null,
    secondaryType: strip(row["Secondary type"]) || null,
    notes: strip(row["AKA/Notes"]),
  });
}

// Register aliases so APPRIL names resolve to the same entry
for (const [apprilName, refName] of Object.entries(ALIAS_MAP)) {
  const entry = refMap.get(norm(refName));
  if (entry) refMap.set(norm(apprilName), entry);
}

console.log(`Reference table: ${refMap.size} entries`);

// ── APPRIL product table ──────────────────────────────────────────────────────

const apprilCsv = readFileSync(
  join(DATA_DIR, "Seed Treatments - APPRIL data.csv"),
  "utf8",
).replace(/^﻿/, "");

const { data: apprilRows, errors: apprilErrors } = Papa.parse(apprilCsv, {
  header: true,
  skipEmptyLines: true,
});

if (apprilErrors.length) {
  console.warn("APPRIL CSV parse warnings:", apprilErrors.slice(0, 5));
}

console.log(`APPRIL rows: ${apprilRows.length}`);

const unmatched = new Set();
let skipped = 0;
const products = [];

for (const row of apprilRows) {
  // Keep only active registrations
  if (strip(row["Status Group"]) !== "Active") {
    skipped++;
    continue;
  }

  // Split embedded-newline multi-value fields
  const ingredientNames = (row["Active Ingredients"] ?? "")
    .split("\n")
    .map((s) => strip(s).replace(/,+$/, ""))
    .filter(Boolean);

  const crops = (row["Crops"] ?? "").split("\n").map(strip).filter(Boolean);

  const ingredients = ingredientNames.map((name) => {
    const ref = refMap.get(norm(name));
    if (!ref) unmatched.add(name);
    return {
      name,
      primaryType: ref?.primaryType ?? null,
      secondaryType: ref?.secondaryType ?? null,
    };
  });

  const primaryTypes = [
    ...new Set(ingredients.map((i) => i.primaryType).filter(Boolean)),
  ];

  products.push({
    regNum: strip(row["Registration Number"]),
    regType: strip(row["Registration Type"]),
    abn: strip(row["ABN"]),
    productName: strip(row["Product Name"]),
    company: strip(row["Company Name"]),
    companyNum: strip(row["Company Number"]),
    ingredients,
    ingredientCount: ingredients.length,
    crops,
    primaryTypes,
    status: strip(row["Status"]),
    statusGroup: strip(row["Status Group"]),
    statusDate: strip(row["Status Date"]),
    dateFirstRegistered: strip(row["Date First Registered"]),
    latestLabelDate: strip(row["Latest Label Date"]),
    pesticideType: strip(row["Pesticide Type"]),
    pesticideCategory: strip(row["Pesticide Category"]),
    physicalForm: strip(row["Physical Form"]),
    signalWord: strip(row["Signal Word"]),
    restrictedUse: strip(row["Restricted Use Flag"]) === "Y",
    restrictedUseReason: strip(row["Restricted Use Reason"]),
    transferHistory: strip(row["Transfer History"]),
    meeToo: strip(row["Similar Product? (Me Too)"]),
    notes: strip(row["Notes"]),
  });
}

console.log(`Skipped (non-active): ${skipped}`);
console.log(`Output products:      ${products.length}`);

if (unmatched.size > 0) {
  console.warn(
    "\nWARNING — ingredients with no type badge (add to ALIAS_MAP if needed):",
  );
  for (const name of [...unmatched].sort()) {
    console.warn(`  - ${name}`);
  }
} else {
  console.log("All ingredients matched reference table.");
}

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public/data.json"), JSON.stringify(products));
console.log("\nWrote public/data.json");
