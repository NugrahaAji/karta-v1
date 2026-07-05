import mongoose from "mongoose";

// Adjustment sub-schema
const adjustmentSchema = new mongoose.Schema({
  dimension: { type: mongoose.Schema.Types.ObjectId, required: true },
  subdimension: { type: mongoose.Schema.Types.ObjectId, required: true },
  finalLevelIndex: { type: Number, required: true },
  adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  adjustedAt: { type: Date, default: Date.now },
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

// SuperAdmin: Action-plan-based monitoring (one row per action plan step)
const monitoringRowSchema = new mongoose.Schema({
  actionPlanGroupId:  { type: mongoose.Schema.Types.ObjectId }, // ref to apGroups element
  actionPlanItemIdx:  { type: Number, default: 0 },             // which step (0-based)
  subdimension:       { type: mongoose.Schema.Types.ObjectId },  // which sub this step targets
  timeline:           [{ type: Number }],                        // active months (1–6)
  pic:                { type: String, default: "" },
  checker:            { type: String, default: "" },
  achievementStatus:  { type: String, enum: ["", "Not Started", "Ongoing", "Completed", "Delayed"], default: "" },
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

    // Company adjustments for disputed subdimensions
    adjustments: [adjustmentSchema],

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
  },
  { timestamps: true }
);

const AssessmentSession = mongoose.model("AssessmentSession", assessmentSessionSchema);
export default AssessmentSession;
