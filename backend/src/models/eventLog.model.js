import mongoose from "mongoose";

const eventLogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true },       // S3/Cloudinary URL
    fileSize: { type: Number },                       // bytes
    fileType: { type: String, enum: ["xes", "csv", "xlsx"] },
    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "error"],
      default: "uploaded",
    },
    stats: {
      totalCases: { type: Number, default: 0 },
      totalEvents: { type: Number, default: 0 },
      totalActivities: { type: Number, default: 0 },
      startDate: { type: Date },
      endDate: { type: Date },
    },
    miningResults: [{ type: mongoose.Schema.Types.ObjectId, ref: "MiningResult" }],
  },
  { timestamps: true }
);

const EventLog = mongoose.model("EventLog", eventLogSchema);
export default EventLog;
