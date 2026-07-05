import crypto from "crypto";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import { sendOtpEmail } from "../services/email.service.js";

// ─── Helpers ────────────────────────────────────────────────────────────────────

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const generateOtp = () =>
  crypto.randomInt(100000, 999999).toString();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

// ─── Register ───────────────────────────────────────────────────────────────────

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, accountRole, plan } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Generate OTP first and try sending email BEFORE creating user
    const code = generateOtp();

    try {
      await sendOtpEmail(email, code, "email_verification");
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
      return res.status(503).json({
        error: "Unable to send verification email. Please check your email address and try again.",
      });
    }

    // Email sent successfully, NOW create the user
    const user = await User.create({
      name,
      email,
      password,
      accountRole: accountRole || "Company",
      plan: plan || "free",
      isVerified: false,
    });

    // Store OTP
    await Otp.deleteMany({ email, type: "email_verification" });
    await Otp.create({
      email,
      code,
      type: "email_verification",
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    // Return token but user.isVerified is false
    // Frontend MUST enforce verification step
    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user,
      requiresVerification: true,
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Verify Email OTP ───────────────────────────────────────────────────────────

export const verifyEmail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, code } = req.body;

    const otpRecord = await Otp.findOne({
      email,
      type: "email_verification",
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "No verification code found. Please request a new one." });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ error: "Too many failed attempts. Please request a new code." });
    }

    if (otpRecord.code !== code) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ error: "Invalid verification code." });
    }

    // Mark user as verified
    await User.findOneAndUpdate({ email }, { isVerified: true });
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({ message: "Email verified successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Resend OTP ─────────────────────────────────────────────────────────────────

export const resendOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, type } = req.body;
    const otpType = type || "email_verification";

    if (otpType === "email_verification") {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found." });
      if (user.isVerified) return res.status(400).json({ error: "Email already verified." });
    }

    const code = generateOtp();
    await Otp.deleteMany({ email, type: otpType });
    await Otp.create({
      email,
      code,
      type: otpType,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    await sendOtpEmail(email, code, otpType);
    res.json({ message: "Verification code sent." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Login ──────────────────────────────────────────────────────────────────────

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Block login if email is NOT verified
    if (!user.isVerified) {
      return res.status(403).json({
        error: "Please verify your email before logging in.",
        requiresVerification: true,
        email: user.email,
      });
    }

    user.lastLogin = new Date();
    await user.save();

    // Reload user with populated fields (password excluded)
    const populatedUser = await User.findById(user._id)
      .select("-password")
      .populate("allowedDimensions", "name detail");

    const token = generateToken(user._id);
    res.json({ token, user: populatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Get Current User ───────────────────────────────────────────────────────────

export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// ─── Logout ─────────────────────────────────────────────────────────────────────

export const logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

// ─── Forgot Password (Send Reset OTP) ───────────────────────────────────────────

export const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: "If that email is registered, a reset code has been sent." });
    }

    const code = generateOtp();
    await Otp.deleteMany({ email, type: "password_reset" });
    await Otp.create({
      email,
      code,
      type: "password_reset",
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    await sendOtpEmail(email, code, "password_reset");
    res.json({ message: "If that email is registered, a reset code has been sent." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Reset Password (Verify OTP + New Password) ─────────────────────────────────

export const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, code, newPassword } = req.body;

    const otpRecord = await Otp.findOne({ email, type: "password_reset" });

    if (!otpRecord) {
      return res.status(400).json({ error: "No reset code found. Please request a new one." });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: "Reset code has expired." });
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ error: "Too many failed attempts. Please request a new code." });
    }

    if (otpRecord.code !== code) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ error: "Invalid reset code." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found." });

    user.password = newPassword;
    await user.save();
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({ message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Change Password (Authenticated) ────────────────────────────────────────────

export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ error: "User not found." });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
