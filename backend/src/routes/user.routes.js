import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

// GET /api/users/profile
router.get("/profile", (req, res) => res.json({ user: req.user }));

// PUT /api/users/profile
router.put("/profile", async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const User = (await import("../models/user.model.js")).default;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true }
    );
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
