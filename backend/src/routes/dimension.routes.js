import express from "express";
import { body } from "express-validator";
import { protect, requireAccountRole } from "../middleware/auth.middleware.js";
import {
  getDimensions,
  getDimension,
  createDimension,
  bulkCreateDimensions,
  updateDimension,
  deleteDimension,
  addSubdimension,
  updateSubdimension,
  deleteSubdimension,
  addLevel,
  updateLevel,
  deleteLevel,
  addCriteria,
  updateCriteria,
  deleteCriteria,
} from "../controllers/dimension.controller.js";

const router = express.Router();

// ─── Validation Rules ────────────────────────────────────────────────────────
const nameRequired = body("name").notEmpty().withMessage("Name is required");
const detailOptional = body("detail").optional();

// ─── Public Routes ──────────────────────────────────────────────────────────
router.get("/", getDimensions);
router.get("/:id", getDimension);

// ─── SuperAdmin Routes ──────────────────────────────────────────────────────
// All routes below require superAdmin authentication
const superAdminGuard = [protect, requireAccountRole("superAdmin")];

// Dimension CRUD
router.post("/bulk", ...superAdminGuard, bulkCreateDimensions);   // bulk create semua sekaligus
router.post("/", ...superAdminGuard, [nameRequired, detailOptional], createDimension);
router.put("/:id", ...superAdminGuard, [detailOptional], updateDimension);
router.delete("/:id", ...superAdminGuard, deleteDimension);

// Subdimension CRUD
router.post("/:id/subdimensions", ...superAdminGuard, [nameRequired, detailOptional], addSubdimension);
router.put("/:dimId/subdimensions/:subId", ...superAdminGuard, [detailOptional], updateSubdimension);
router.delete("/:dimId/subdimensions/:subId", ...superAdminGuard, deleteSubdimension);

// Level CRUD
router.post(
  "/:dimId/subdimensions/:subId/levels",
  ...superAdminGuard,
  [nameRequired, detailOptional],
  addLevel
);
router.put(
  "/:dimId/subdimensions/:subId/levels/:levelId",
  ...superAdminGuard,
  [detailOptional],
  updateLevel
);
router.delete(
  "/:dimId/subdimensions/:subId/levels/:levelId",
  ...superAdminGuard,
  deleteLevel
);

// Criteria CRUD
router.post(
  "/:dimId/subdimensions/:subId/levels/:levelId/criteria",
  ...superAdminGuard,
  [nameRequired, detailOptional],
  addCriteria
);
router.put(
  "/:dimId/subdimensions/:subId/levels/:levelId/criteria/:criteriaId",
  ...superAdminGuard,
  [detailOptional],
  updateCriteria
);
router.delete(
  "/:dimId/subdimensions/:subId/levels/:levelId/criteria/:criteriaId",
  ...superAdminGuard,
  deleteCriteria
);

export default router;
