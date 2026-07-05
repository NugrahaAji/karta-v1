import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getMe,
  logout,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// ─── Public Routes ──────────────────────────────────────────────────────────────

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 characters"),
    body("accountRole").optional().isIn(["superAdmin", "Company", "Consultant", "Researcher", "PM"]),
    body("plan").optional().isIn(["free", "pro", "enterprise", "researcher_plan"]),
  ],
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

router.post(
  "/verify-email",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("code").isLength({ min: 6, max: 6 }).withMessage("6-digit code required"),
  ],
  verifyEmail
);

router.post(
  "/resend-otp",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("type").optional().isIn(["email_verification", "password_reset"]),
  ],
  resendOtp
);

router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email required")],
  forgotPassword
);

router.post(
  "/reset-password",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("code").isLength({ min: 6, max: 6 }).withMessage("6-digit code required"),
    body("newPassword").isLength({ min: 6 }).withMessage("Password min 6 characters"),
  ],
  resetPassword
);

// ─── Google OAuth ────────────────────────────────────────────────────────────────

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",   
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:3000"}/auth/login?error=google_auth_failed`,
  }),
  (req, res) => {
    // Generate JWT token for the authenticated user
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    // Redirect to frontend with token
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  }
);

// ─── Protected Routes ───────────────────────────────────────────────────────────

router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

router.post(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password min 6 characters"),
  ],
  changePassword
);

export default router;
