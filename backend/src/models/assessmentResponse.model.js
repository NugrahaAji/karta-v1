import mongoose from "mongoose";

// Each item represents a member's answer for one subdimension
const responseItemSchema = new mongoose.Schema({
  dimension:          { type: mongoose.Schema.Types.ObjectId, required: true },
  subdimension:       { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedLevel:      { type: mongoose.Schema.Types.ObjectId, required: true },
  // 0-indexed position in the levels array → levelNumber = index + 1
  selectedLevelIndex: { type: Number, required: true },
  // Which specific criteria card was selected (optional — for visual restore)
  selectedCriteria:   { type: mongoose.Schema.Types.ObjectId, default: null },
  // Optional note written by the member for this subdimension
  note:               { type: String, default: "" },
});

const assessmentResponseSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSession",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    responses: [responseItemSchema],
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One response per user per session
assessmentResponseSchema.index({ session: 1, user: 1 }, { unique: true });

const AssessmentResponse = mongoose.model(
  "AssessmentResponse",
  assessmentResponseSchema
);
export default AssessmentResponse;
