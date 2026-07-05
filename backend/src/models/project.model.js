import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["viewer", "editor", "admin"], default: "viewer" },
      },
    ],
    eventLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "EventLog" }],
    status: { type: String, enum: ["active", "archived"], default: "active" },
    tags: [String],
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
