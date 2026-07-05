import mongoose from "mongoose";

// ─── Criteria Schema ─────────────────────────────────────────────────────────
const criteriaSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  detail: { type: String, default: "" },
});

// ─── Level Schema ────────────────────────────────────────────────────────────
const levelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  detail: { type: String, default: "" },
  criteria: [criteriaSchema],
});

// ─── Sub-Dimension Schema ────────────────────────────────────────────────────
const subdimensionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  detail: { type: String, default: "" },
  levels: [levelSchema],
});

// ─── Dimension Schema ───────────────────────────────────────────────────────
const dimensionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    detail: { type: String, default: "" },
    subdimensions: [subdimensionSchema],
  },
  { timestamps: true }
);

// ─── Auto-compute bobot based on level position ─────────────────────────────
// Level N (1-indexed) → max bobot = N, evenly split among criteria in that level
// Example: Level 2 with 3 criteria → each criteria bobot = 2/3 ≈ 0.6667
function computeBobot(ret) {
  for (const sub of ret.subdimensions || []) {
    for (let i = 0; i < (sub.levels || []).length; i++) {
      const level = sub.levels[i];
      const levelNumber = i + 1;
      const count = (level.criteria || []).length;
      for (const c of level.criteria || []) {
        c.bobot = count > 0
          ? Math.round((levelNumber / count) * 10000) / 10000
          : 0;
      }
    }
  }
  return ret;
}

dimensionSchema.set("toJSON", {
  transform(_doc, ret) { return computeBobot(ret); },
});
dimensionSchema.set("toObject", {
  transform(_doc, ret) { return computeBobot(ret); },
});

const Dimension = mongoose.model("Dimension", dimensionSchema);
export default Dimension;
