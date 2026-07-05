import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import Dimension from "../models/dimension.model.js";

// ─── GET /api/company/members ─────────────────────────────────────────────────
// Returns all members that were created by the current company account
export const getMembers = async (req, res) => {
  try {
    const members = await User.find({ createdBy: req.user._id })
      .select("-password")
      .populate("allowedDimensions", "name detail")
      .sort({ createdAt: -1 });
    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── POST /api/company/members ────────────────────────────────────────────────
// Company creates a new member account (role is always "member")
export const createMember = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password, allowedDimensions } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    // Validate that provided dimension IDs actually exist
    if (allowedDimensions?.length) {
      const foundDims = await Dimension.find({ _id: { $in: allowedDimensions } }).select("_id");
      if (foundDims.length !== allowedDimensions.length) {
        return res.status(400).json({ error: "One or more dimension IDs are invalid" });
      }
    }

    const member = await User.create({
      name,
      email,
      password,
      accountRole: "Company",       // same accountRole as parent
      role: "member",               // company-created accounts are always "member"
      createdBy: req.user._id,
      isVerified: true,             // company-created accounts skip email verification
      plan: req.user.plan,          // inherit plan from company
      allowedDimensions: allowedDimensions ?? [],
    });

    const populated = await member.populate("allowedDimensions", "name detail");
    res.status(201).json({ member: populated, message: "Member account created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── PUT /api/company/members/:id ────────────────────────────────────────────
// Company updates a member they own
export const updateMember = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const member = await User.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!member) return res.status(404).json({ error: "Member not found" });

    const { name, isActive, allowedDimensions } = req.body;
    if (name !== undefined) member.name = name;
    if (isActive !== undefined) member.isActive = isActive;

    // Update assigned dimensions if provided
    if (allowedDimensions !== undefined) {
      if (allowedDimensions.length) {
        const foundDims = await Dimension.find({ _id: { $in: allowedDimensions } }).select("_id");
        if (foundDims.length !== allowedDimensions.length) {
          return res.status(400).json({ error: "One or more dimension IDs are invalid" });
        }
      }
      member.allowedDimensions = allowedDimensions;
    }

    // If password provided, update it
    if (req.body.password) {
      member.password = req.body.password; // pre-save hook hashes it
    }

    await member.save();
    const populated = await member.populate("allowedDimensions", "name detail");
    res.json({ member: populated, message: "Member updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── DELETE /api/company/members/:id ─────────────────────────────────────────
// Company deletes a member they own
export const deleteMember = async (req, res) => {
  try {
    const member = await User.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json({ message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
