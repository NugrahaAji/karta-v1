/**
 * HP3M Dimension Seeder
 *
 * Menggunakan data resmi dari:
 *   - all_dimensions.json  → 6 dimensi HP3M
 *   - governance.json      → dimensi Governance (Communication, Quality Metric,
 *                            Documentation System, Ownership)
 *
 * Kedua file di-merge menjadi satu array, dengan field MongoDB internal
 * (_id, $oid, __v, createdAt, updatedAt) di-strip otomatis.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const allDimensions  = require("../../all_dimensions.json");   // array of 6 dims
const governanceRaw  = require("../../governance.json");        // single object

/**
 * Konversi satu dimensi dari JSON mentah ke format Mongoose.
 * Strip semua field MongoDB internal (_id, $oid, __v, createdAt, updatedAt).
 */
function convertDimension(dim) {
  return {
    name:   dim.name,
    detail: dim.detail ?? "",
    subdimensions: (dim.subdimensions ?? []).map(sub => ({
      name:   sub.name,
      detail: sub.detail ?? "",
      levels: (sub.levels ?? []).map(level => ({
        name:   level.name,
        detail: level.detail ?? "",
        criteria: (level.criteria ?? []).map(c => ({
          name:   c.name,
          detail: c.detail ?? "",
        })),
      })),
    })),
  };
}

// Gabungkan: 6 dimensi dari all_dimensions.json + Governance dari governance.json
const dimensionSeedData = [
  ...allDimensions.map(convertDimension),
  convertDimension(governanceRaw),
];

export default dimensionSeedData;
