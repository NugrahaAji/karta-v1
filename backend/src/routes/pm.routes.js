import express from "express";
import { body } from "express-validator";
import { protect, requireAccountRole } from "../middleware/auth.middleware.js";
import {
  createPM,
  listPMs,
  getPM,
  updatePM,
  deletePM,
} from "../controllers/pm.controller.js";

const router = express.Router();

// All PM routes require authentication + Company accountRole
router.use(protect, requireAccountRole("Company"));

router.post(
  "/create",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 characters"),
  ],
  createPM
);

router.get("/list", listPMs);
router.get("/:id", getPM);

router.put(
  "/:id",
  [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("email").optional().isEmail().withMessage("Valid email required"),
    body("password").optional().isLength({ min: 6 }).withMessage("Password min 6 characters"),
  ],
  updatePM
);

router.delete("/:id", deletePM);

export default router;
