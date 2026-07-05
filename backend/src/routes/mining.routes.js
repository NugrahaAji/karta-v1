import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

// POST /api/mining/run
router.post("/run", (req, res) => {
  // TODO: trigger Alpha Miner / Inductive Miner via Bull queue
  // Optionally delegate to Python microservice
  res.status(202).json({ message: "Mining job queued" });
});

// GET /api/mining/results/:eventLogId
router.get("/results/:eventLogId", (req, res) => {
  res.json({ message: "Get mining results — TODO" });
});

export default router;
