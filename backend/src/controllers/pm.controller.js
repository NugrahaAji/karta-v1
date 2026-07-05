import { validationResult } from "express-validator";
import User from "../models/user.model.js";

// ─── Create PM Account (Company only) ───────────────────────────────────────────

export const createPM = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const pm = await User.create({
      name,
      email,
      password,
      role: "member",
      accountRole: "PM",
      createdBy: req.user._id,
      isVerified: true, // PM accounts verified by company
      isActive: true,
    });

    res.status(201).json({
      message: "PM account created successfully",
      user: pm,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── List PM Accounts (Company only) ────────────────────────────────────────────

export const listPMs = async (req, res) => {
  try {
    const pms = await User.find({
      createdBy: req.user._id,
      accountRole: "PM",
    }).sort({ createdAt: -1 });

    res.json({ users: pms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Get Single PM ──────────────────────────────────────────────────────────────

export const getPM = async (req, res) => {
  try {
    const pm = await User.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      accountRole: "PM",
    });

    if (!pm) return res.status(404).json({ error: "PM account not found" });
    res.json({ user: pm });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Update PM Account ─────────────────────────────────────────────────────────

export const updatePM = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const pm = await User.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      accountRole: "PM",
    });

    if (!pm) return res.status(404).json({ error: "PM account not found" });

    if (name) pm.name = name;
    if (email) pm.email = email;
    if (password) pm.password = password;
    await pm.save();

    res.json({ message: "PM account updated successfully", user: pm });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Deactivate PM Account ──────────────────────────────────────────────────────

export const deletePM = async (req, res) => {
  try {
    const pm = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id,
        accountRole: "PM",
      },
      { isActive: false },
      { new: true }
    );

    if (!pm) return res.status(404).json({ error: "PM account not found" });
    res.json({ message: "PM account deactivated successfully", user: pm });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
