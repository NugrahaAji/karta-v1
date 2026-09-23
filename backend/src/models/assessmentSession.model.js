import mongoose from "mongoose";

// finalScore sub-schema — satu entry per subdimensi yang telah memiliki nilai final
// source: 'majority'  → dihitung otomatis dari modus jawaban semua assessor
//         'adjusted'  → di-override manual oleh Company
const finalScoreSchema = new mongoose.Schema({
  dimension:       { type: mongoose.Schema.Types.ObjectId, required: true },
  subdimension:    { type: mongoose.Schema.Types.ObjectId, required: true },
  finalLevelIndex: { type: Number, required: true },
  source:          { type: String, enum: ["majority", "adjusted"], default: "majority" },
  adjustedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  adjustedAt:      { type: Date },
});

// SuperAdmin: Strength/Weakness + Opportunity Analysis per dimension
const dimensionAnalysisSchema = new mongoose.Schema({
  dimension:               { type: mongoose.Schema.Types.ObjectId, required: true },
  strengthWeaknessItems:   [{ type: String }],
  opportunityAnalysisItems:[{ type: String }],
});

// SuperAdmin: Action Plan Group — one group can span multiple subdimensions
const actionPlanGroupSchema = new mongoose.Schema({
  label:         { type: String, default: "" },              // optional group label
  items:         [{ type: String }],                         // numbered action plan steps
  subdimensions: [{ type: mongoose.Schema.Types.ObjectId }], // which subdimensions this covers
  order:         { type: Number, default: 0 },               // display order
});

// SuperAdmin: Expected Level per subdimension
const subdimensionAnalysisSchema = new mongoose.Schema({
  dimension:    { type: mongoose.Schema.Types.ObjectId, required: true },
  subdimension: { type: mongoose.Schema.Types.ObjectId, required: true },
  expectedLevel:{ type: Number, default: null },
});

// SuperAdmin: Custom monitoring columns (adjustable by SuperAdmin)
const monitoringColumnSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  type:  { type: String, enum: ["text", "number", "select", "date", "checkbox"], default: "text" },
  options: [{ type: String }], // For 'select' type: list of options
  order: { type: Number, default: 0 },
});

// Monitoring data: per subdimension, keyed by column ID
const monitoringCellSchema = new mongoose.Schema({
  dimension:    { type: mongoose.Schema.Types.ObjectId, required: true },
  subdimension: { type: mongoose.Schema.Types.ObjectId, required: true },
  columnId:     { type: mongoose.Schema.Types.ObjectId, required: true },
  value:        { type: mongoose.Schema.Types.Mixed, default: "" },
});

const timelineStatusSchema = new mongoose.Schema({
  month:  { type: Number, min: 1, max: 6, required: true },
  status: { type: String, enum: ["Targeted", "Not Started", "Ongoing", "Completed", "Delayed"], required: true },
}, { _id: false });

// SuperAdmin: Action-plan-based monitoring (one row per action plan step)
const monitoringRowSchema = new mongoose.Schema({
  actionPlanGroupId:  { type: mongoose.Schema.Types.ObjectId }, // ref to apGroups element
  actionPlanItemIdx:  { type: Number, default: 0 },             // which step (0-based)
  subdimension:       { type: mongoose.Schema.Types.ObjectId },  // which sub this step targets
  timeline:           [{ type: Number }],                        // legacy active months (1–6)
  timelineStatuses:   [timelineStatusSchema],                    // independent status per month
  pic:                { type: String, default: "" },
  checker:            { type: String, default: "" },
  achievementStatus:  { type: String, enum: ["", "Targeted", "Not Started", "Ongoing", "Completed", "Delayed"], default: "" },
  notes:              { type: String, default: "" },
});

const assessmentSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // The Company account that created the session
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Member accounts assigned to participate
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Dimension IDs included in this session (empty = all dimensions)
    dimensions: [{ type: mongoose.Schema.Types.ObjectId }],

    status: {
      type: String,
      enum: ["draft", "scheduled", "active", "completed", "cancelled"],
      default: "draft",
    },

    startDate: { type: Date },
    endDate: { type: Date },

    // Final scores per subdimension:
    // - source='majority'  → auto-computed dari modus jawaban assessor
    // - source='adjusted'  → di-override manual oleh Company
    // Semua subdimensi yang sudah punya data (majority atau adjusted) disimpan di sini.
    finalScores: [finalScoreSchema],

    // SuperAdmin analysis
    dimensionAnalysis:    [dimensionAnalysisSchema],

    // SuperAdmin action plan groups (flexible: one group → many subdimensions)
    actionPlanGroups:     [actionPlanGroupSchema],

    // SuperAdmin monitoring (legacy custom columns)
    monitoringColumns:    [monitoringColumnSchema],
    monitoringData:       [monitoringCellSchema],
    subdimensionAnalysis: [subdimensionAnalysisSchema],

    // SuperAdmin monitoring rows (action-plan-based)
    monitoringRows:       [monitoringRowSchema],

    // ─── AI Reasoning Result (permanent, one-time generate) ───────────────────
    // Menyimpan hasil flat array per sub-dimensi dari Reasoning Engine.
    // Setelah terisi, flag aiAnalysisLocked = true agar tidak bisa di-generate ulang.
    aiAnalysis:       { type: mongoose.Schema.Types.Mixed, default: null },
    aiGeneratedAt:    { type: Date, default: null },
    aiAnalysisLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AssessmentSession = mongoose.model("AssessmentSession", assessmentSessionSchema);
export default AssessmentSession;
