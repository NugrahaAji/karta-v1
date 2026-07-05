import Dimension from "../models/dimension.model.js";
import { validationResult } from "express-validator";

// ═══════════════════════════════════════════════════════════════════════════════
// DIMENSION CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/dimensions — List all dimensions
export const getDimensions = async (req, res) => {
  try {
    const dimensions = await Dimension.find().sort({ name: 1 });
    res.json({ dimensions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/dimensions/:id — Get single dimension
export const getDimension = async (req, res) => {
  try {
    const dimension = await Dimension.findById(req.params.id);
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });
    res.json({ dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/dimensions — Create dimension (superAdmin)
export const createDimension = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, detail, subdimensions } = req.body;
    const dimension = await Dimension.create({ name, detail, subdimensions: subdimensions || [] });
    res.status(201).json({ dimension });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Dimension with this name already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/dimensions/:id — Update dimension (superAdmin)
export const updateDimension = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, detail } = req.body;
    const dimension = await Dimension.findByIdAndUpdate(
      req.params.id,
      { name, detail },
      { new: true, runValidators: true }
    );
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });
    res.json({ dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/dimensions/:id — Delete dimension (superAdmin)
export const deleteDimension = async (req, res) => {
  try {
    const dimension = await Dimension.findByIdAndDelete(req.params.id);
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });
    res.json({ message: "Dimension deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUBDIMENSION CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/dimensions/:id/subdimensions
export const addSubdimension = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const dimension = await Dimension.findById(req.params.id);
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });

    const { name, detail, levels } = req.body;
    dimension.subdimensions.push({ name, detail, levels: levels || [] });
    await dimension.save();

    const newSub = dimension.subdimensions[dimension.subdimensions.length - 1];
    res.status(201).json({ subdimension: newSub, dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/dimensions/:dimId/subdimensions/:subId
export const updateSubdimension = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const dimension = await Dimension.findById(req.params.dimId);
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });

    const sub = dimension.subdimensions.id(req.params.subId);
    if (!sub) return res.status(404).json({ error: "Subdimension not found" });

    const { name, detail } = req.body;
    if (name) sub.name = name;
    if (detail !== undefined) sub.detail = detail;
    await dimension.save();

    res.json({ subdimension: sub, dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/dimensions/:dimId/subdimensions/:subId
export const deleteSubdimension = async (req, res) => {
  try {
    const dimension = await Dimension.findById(req.params.dimId);
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });

    const sub = dimension.subdimensions.id(req.params.subId);
    if (!sub) return res.status(404).json({ error: "Subdimension not found" });

    sub.deleteOne();
    await dimension.save();

    res.json({ message: "Subdimension deleted successfully", dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/dimensions/:dimId/subdimensions/:subId/levels
export const addLevel = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const dimension = await Dimension.findById(req.params.dimId);
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });

    const sub = dimension.subdimensions.id(req.params.subId);
    if (!sub) return res.status(404).json({ error: "Subdimension not found" });

    const { name, detail, criteria } = req.body;
    sub.levels.push({ name, detail, criteria: criteria || [] });
    await dimension.save();

    const newLevel = sub.levels[sub.levels.length - 1];
    res.status(201).json({ level: newLevel, dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/dimensions/:dimId/subdimensions/:subId/levels/:levelId
export const updateLevel = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const dimension = await Dimension.findById(req.params.dimId);
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });

    const sub = dimension.subdimensions.id(req.params.subId);
    if (!sub) return res.status(404).json({ error: "Subdimension not found" });

    const level = sub.levels.id(req.params.levelId);
    if (!level) return res.status(404).json({ error: "Level not found" });

    const { name, detail } = req.body;
    if (name) level.name = name;
    if (detail !== undefined) level.detail = detail;
    await dimension.save();

    res.json({ level, dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/dimensions/:dimId/subdimensions/:subId/levels/:levelId
export const deleteLevel = async (req, res) => {
  try {
    const dimension = await Dimension.findById(req.params.dimId);
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });

    const sub = dimension.subdimensions.id(req.params.subId);
    if (!sub) return res.status(404).json({ error: "Subdimension not found" });

    const level = sub.levels.id(req.params.levelId);
    if (!level) return res.status(404).json({ error: "Level not found" });

    level.deleteOne();
    await dimension.save();

    res.json({ message: "Level deleted successfully", dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CRITERIA CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/dimensions/:dimId/subdimensions/:subId/levels/:levelId/criteria
export const addCriteria = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const dimension = await Dimension.findById(req.params.dimId);
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });

    const sub = dimension.subdimensions.id(req.params.subId);
    if (!sub) return res.status(404).json({ error: "Subdimension not found" });

    const level = sub.levels.id(req.params.levelId);
    if (!level) return res.status(404).json({ error: "Level not found" });

    const { name, detail } = req.body;
    level.criteria.push({ name, detail });
    await dimension.save();

    const newCriteria = level.criteria[level.criteria.length - 1];
    res.status(201).json({ criteria: newCriteria, dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/dimensions/:dimId/subdimensions/:subId/levels/:levelId/criteria/:criteriaId
export const updateCriteria = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const dimension = await Dimension.findById(req.params.dimId);
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });

    const sub = dimension.subdimensions.id(req.params.subId);
    if (!sub) return res.status(404).json({ error: "Subdimension not found" });

    const level = sub.levels.id(req.params.levelId);
    if (!level) return res.status(404).json({ error: "Level not found" });

    const criteria = level.criteria.id(req.params.criteriaId);
    if (!criteria) return res.status(404).json({ error: "Criteria not found" });

    const { name, detail } = req.body;
    if (name) criteria.name = name;
    if (detail !== undefined) criteria.detail = detail;
    await dimension.save();

    res.json({ criteria, dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/dimensions/:dimId/subdimensions/:subId/levels/:levelId/criteria/:criteriaId
export const deleteCriteria = async (req, res) => {
  try {
    const dimension = await Dimension.findById(req.params.dimId);
    if (!dimension) return res.status(404).json({ error: "Dimension not found" });

    const sub = dimension.subdimensions.id(req.params.subId);
    if (!sub) return res.status(404).json({ error: "Subdimension not found" });

    const level = sub.levels.id(req.params.levelId);
    if (!level) return res.status(404).json({ error: "Level not found" });

    const criteria = level.criteria.id(req.params.criteriaId);
    if (!criteria) return res.status(404).json({ error: "Criteria not found" });

    criteria.deleteOne();
    await dimension.save();

    res.json({ message: "Criteria deleted successfully", dimension });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
