import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

// GET /api/users/profile
router.get("/profile", (req, res) => res.json({ user: req.user }));

// PUT /api/users/profile
router.put("/profile", async (req, res) => {
  try {
    const { name, avatar, companyProfile, completeOnboarding } = req.body;
    const User = (await import("../models/user.model.js")).default;
    const updates = {};

    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof avatar === "string") updates.avatar = avatar.trim();

    const isCompanyOwner = req.user.accountRole === "Company" && !req.user.createdBy;
    if (isCompanyOwner && companyProfile && typeof companyProfile === "object") {
      const stringFields = [
        "businessIndustry", "processMiningStart",
        "processMiningProcesses", "processMiningTechnology",
        "managementReadiness", "measurementScope", "additionalInfo",
      ];

      updates.companyProfile = {
        // String fields
        ...Object.fromEntries(
          stringFields.map(field => {
            const val = companyProfile[field];
            return [field, typeof val === "string" ? val.trim() : ""];
          })
        ),
        // Array field — accept array or fall back to splitting a legacy string
        processMiningTeam: Array.isArray(companyProfile.processMiningTeam)
          ? companyProfile.processMiningTeam.map(s => String(s).trim()).filter(Boolean)
          : typeof companyProfile.processMiningTeam === "string"
            ? companyProfile.processMiningTeam.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
            : [],
      };

      if (completeOnboarding === true) {
        const requiredStringFields = [
          "businessIndustry", "processMiningStart",
          "processMiningProcesses", "processMiningTechnology",
          "managementReadiness", "measurementScope",
        ];
        const stringsOk = requiredStringFields.every(f => updates.companyProfile[f]);
        const teamOk = updates.companyProfile.processMiningTeam.length > 0;
        if (!stringsOk || !teamOk) {
          return res.status(400).json({ error: "Please answer every company profile question." });
        }
        updates.isOnboarding = true;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
