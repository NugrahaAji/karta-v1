import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  code: { type: String, required: true },
  type: {
    type: String,
    enum: ["email_verification", "password_reset"],
    required: true,
  },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  attempts: { type: Number, default: 0 },
}, { timestamps: true });

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
