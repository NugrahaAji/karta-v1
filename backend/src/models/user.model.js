import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const companyProfileSchema = new mongoose.Schema({
  businessIndustry:       { type: String, trim: true, maxlength: 3000, default: "" },
  processMiningStart:     { type: String, trim: true, maxlength: 3000, default: "" },
  processMiningTeam:      { type: [String], default: [] },
  processMiningProcesses: { type: String, trim: true, maxlength: 5000, default: "" },
  processMiningTechnology:{ type: String, trim: true, maxlength: 5000, default: "" },
  managementReadiness:    { type: String, trim: true, maxlength: 5000, default: "" },
  measurementScope:       { type: String, trim: true, maxlength: 5000, default: "" },
  additionalInfo:         { type: String, trim: true, maxlength: 5000, default: "" },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, minlength: 6 },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["superAdmin", "owner", "admin", "member"], default: "member" },
    memberRole: { type: String, trim: true, default: "" },
    accountRole: {
      type: String,
      enum: ["superAdmin", "Company", "Consultant", "Researcher", "PM"],
      default: "Company",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Dimensions accessible to this member (assigned by Company)
    allowedDimensions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Dimension" }],
    isActive: { type: Boolean, default: true },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise", "researcher_plan"],
      default: "free",
    },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    companyProfile: { type: companyProfileSchema, default: () => ({}) },
    isOnboarding: { type: Boolean, default: false },
    avatar: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", userSchema);
export default User;
