import express from "express";
import { body } from "express-validator";
import { protect, requireAccountRole } from "../middleware/auth.middleware.js";
import { getMembers, createMember, updateMember, deleteMember } from "../controllers/company.controller.js";

const router = express.Router();

// All routes require Company (or superAdmin) account role
const companyGuard = [protect, requireAccountRole("Company")];

// ─── Member Management ────────────────────────────────────────────────────────

// GET    /api/company/members         → list all members created by this company
router.get("/members", ...companyGuard, getMembers);

// POST   /api/company/members         → create a new member account (always role=member)
router.post(
  "/members",
  ...companyGuard,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("allowedDimensions").optional().isArray().withMessage("allowedDimensions must be an array"),
    body("allowedDimensions.*").optional().isMongoId().withMessage("Each dimension ID must be a valid ID"),
  ],
  createMember
);

// PUT    /api/company/members/:id     → update a member
router.put(
  "/members/:id",
  ...companyGuard,
  [
    body("name").optional().notEmpty(),
    body("password").optional().isLength({ min: 6 }),
    body("isActive").optional().isBoolean(),
    body("allowedDimensions").optional().isArray().withMessage("allowedDimensions must be an array"),
    body("allowedDimensions.*").optional().isMongoId().withMessage("Each dimension ID must be a valid ID"),
  ],
  updateMember
);

// DELETE /api/company/members/:id     → remove a member
router.delete("/members/:id", ...companyGuard, deleteMember);

export default router;
