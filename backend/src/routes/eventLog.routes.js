import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

// POST /api/event-logs/upload
router.post("/upload", (req, res) => {
  // TODO: multer upload → parse XES/CSV → Bull queue job
  res.status(202).json({ message: "Upload received, processing started" });
});

// GET /api/event-logs/:id
router.get("/:id", (req, res) => {
  res.json({ message: "Get event log by id — TODO" });
});

export default router;
