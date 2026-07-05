import AssessmentSession from "../models/assessmentSession.model.js";
import AssessmentResponse from "../models/assessmentResponse.model.js";
import User from "../models/user.model.js";
import Dimension from "../models/dimension.model.js";

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY: SESSION CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Company: list own sessions ───────────────────────────────────────────────
export const getCompanySessions = async (req, res) => {
  try {
    const sessions = await AssessmentSession.find({ company: req.user._id })
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });
    res.json({ sessions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─── Company: create session ──────────────────────────────────────────────────
export const createSession = async (req, res) => {
  try {
    const { title, description, assignedTo, dimensions, status, startDate, endDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

    // Validate assigned members belong to this company
    if (assignedTo?.length) {
      const members = await User.find({ _id: { $in: assignedTo }, createdBy: req.user._id });
      if (members.length !== assignedTo.length) {
        return res.status(400).json({ error: "Some assigned members do not belong to your company" });
      }
    }

    const session = await AssessmentSession.create({
      title: title.trim(),
      description: description?.trim() ?? "",
      company: req.user._id,
      assignedTo: assignedTo ?? [],
      dimensions: dimensions ?? [],
      status: status ?? "draft",
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    const populated = await session.populate("assignedTo", "name email role");
    res.status(201).json({ session: populated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─── Company: update session ──────────────────────────────────────────────────
export const updateSession = async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({ _id: req.params.id, company: req.user._id });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { title, description, assignedTo, dimensions, status, startDate, endDate } = req.body;

    if (title !== undefined) session.title = title.trim();
    if (description !== undefined) session.description = description.trim();
    if (assignedTo !== undefined) session.assignedTo = assignedTo;
    if (dimensions !== undefined) session.dimensions = dimensions;
    if (status !== undefined) session.status = status;
    if (startDate !== undefined) session.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) session.endDate = endDate ? new Date(endDate) : undefined;

    await session.save();
    const populated = await session.populate("assignedTo", "name email role");
    res.json({ session: populated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─── Company: delete session ──────────────────────────────────────────────────
export const deleteSession = async (req, res) => {
  try {
    const session = await AssessmentSession.findOneAndDelete({ _id: req.params.id, company: req.user._id });
    if (!session) return res.status(404).json({ error: "Session not found" });
    // Also clean up all responses for this session
    await AssessmentResponse.deleteMany({ session: session._id });
    res.json({ message: "Session deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER: SESSIONS & RESPONSES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Member: get my assigned sessions ────────────────────────────────────────
export const getMySessions = async (req, res) => {
  try {
    const rawAllowed = req.user.allowedDimensions ?? [];

    // allowedDimensions may be populated objects OR bare ObjectIds depending on
    // how the user was loaded — normalize to an array of ObjectId-compatible values.
    const memberAllowedIds = rawAllowed.map(d => d._id ?? d);

    // Build query: must be assigned to this member, not cancelled
    const query = {
      assignedTo: req.user._id,
      status: { $ne: "cancelled" },
    };

    // If member has allowedDimensions restriction, filter sessions accordingly:
    // - sessions with no dimensions set (open to all), OR
    // - sessions whose dimensions array overlaps with member's allowedDimensions
    if (memberAllowedIds.length > 0) {
      query.$or = [
        { dimensions: { $size: 0 } },
        { dimensions: { $in: memberAllowedIds } },
      ];
    }

    const sessions = await AssessmentSession.find(query)
      .populate("company", "name email")
      .sort({ startDate: 1, createdAt: -1 });

    res.json({ sessions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─── Shared: get single session detail ───────────────────────────────────────
export const getSessionDetail = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("company", "name email");

    if (!session) return res.status(404).json({ error: "Session not found" });

    // Check access: must be company owner or assigned member
    const isOwner = session.company._id.toString() === req.user._id.toString();
    const isMember = session.assignedTo.some(m => m._id.toString() === req.user._id.toString());
    if (!isOwner && !isMember) return res.status(403).json({ error: "Access denied" });

    res.json({ session });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER: SUBMIT / GET RESPONSE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Member: submit or update assessment response ────────────────────────────
export const submitResponse = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Must be assigned to this session
    const isAssigned = session.assignedTo.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isAssigned) return res.status(403).json({ error: "You are not assigned to this session" });

    // Session must be active
    if (session.status !== "active") {
      return res.status(400).json({ error: "Session is not active" });
    }

    const { responses } = req.body;
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: "Responses are required" });
    }

    // Validate each response item
    for (const r of responses) {
      if (!r.dimension || !r.subdimension || !r.selectedLevel || r.selectedLevelIndex === undefined) {
        return res.status(400).json({ error: "Each response must have dimension, subdimension, selectedLevel, and selectedLevelIndex" });
      }
    }

    // Upsert: create or replace
    // Map responses to include optional selectedCriteria
    const mappedResponses = responses.map(r => ({
      dimension:          r.dimension,
      subdimension:       r.subdimension,
      selectedLevel:      r.selectedLevel,
      selectedLevelIndex: r.selectedLevelIndex,
      selectedCriteria:   r.selectedCriteria ?? null,
      note:               r.note?.trim() ?? "",
    }));

    const response = await AssessmentResponse.findOneAndUpdate(
      { session: session._id, user: req.user._id },
      {
        session:     session._id,
        user:        req.user._id,
        responses:   mappedResponses,
        submittedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ response });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─── Member: get my response for a session ──────────────────────────────────
export const getMyResponse = async (req, res) => {
  try {
    const response = await AssessmentResponse.findOne({
      session: req.params.id,
      user: req.user._id,
    });
    res.json({ response: response ?? null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY: RESULTS & ADJUSTMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Company: get all responses + full dimension data for a session ──────────
export const getSessionResults = async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({
      _id: req.params.id,
      company: req.user._id,
    })
      .populate("assignedTo", "name email role")
      .populate("adjustments.adjustedBy", "name email");

    if (!session) return res.status(404).json({ error: "Session not found" });

    // Get all responses for this session
    const responses = await AssessmentResponse.find({ session: session._id })
      .populate("user", "name email role");

    // Get full dimension data
    let dimensionIds = session.dimensions ?? [];
    let dims;
    if (dimensionIds.length > 0) {
      dims = await Dimension.find({ _id: { $in: dimensionIds } }).sort({ name: 1 });
    } else {
      dims = await Dimension.find().sort({ name: 1 });
    }

    res.json({
      session,
      responses,
      dimensions: dims,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─── Company: adjust a disputed subdimension ────────────────────────────────
export const adjustSubdimension = async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({
      _id: req.params.id,
      company: req.user._id,
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { dimension, subdimension, finalLevelIndex } = req.body;
    if (!dimension || !subdimension || finalLevelIndex === undefined) {
      return res.status(400).json({ error: "dimension, subdimension, and finalLevelIndex are required" });
    }

    const existingIdx = session.adjustments.findIndex(
      (a) =>
        a.dimension.toString() === dimension &&
        a.subdimension.toString() === subdimension
    );

    const adjustmentData = {
      dimension,
      subdimension,
      finalLevelIndex,
      adjustedBy: req.user._id,
      adjustedAt: new Date(),
    };

    if (existingIdx >= 0) {
      session.adjustments[existingIdx] = adjustmentData;
    } else {
      session.adjustments.push(adjustmentData);
    }

    await session.save();

    const populated = await session.populate("adjustments.adjustedBy", "name email");
    res.json({ session: populated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: VIEW ALL SESSIONS & SAVE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── SuperAdmin: list all sessions from all companies ─────────────────────────
export const getAllSessionsAdmin = async (req, res) => {
  try {
    const sessions = await AssessmentSession.find()
      .populate("company", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });
    res.json({ sessions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─── SuperAdmin: get full results for any session ────────────────────────────
export const getSessionResultsAdmin = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id)
      .populate("company", "name email")
      .populate("assignedTo", "name email role")
      .populate("adjustments.adjustedBy", "name email");

    if (!session) return res.status(404).json({ error: "Session not found" });

    const responses = await AssessmentResponse.find({ session: session._id })
      .populate("user", "name email role");

    const dimensionIds = session.dimensions ?? [];
    const dims = dimensionIds.length > 0
      ? await Dimension.find({ _id: { $in: dimensionIds } }).sort({ name: 1 })
      : await Dimension.find().sort({ name: 1 });

    res.json({ session, responses, dimensions: dims });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─── SuperAdmin: save analysis (strength/weakness + opportunity + action plan + expected) ───
export const saveSessionAnalysis = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { dimensionAnalysis, subdimensionAnalysis } = req.body;

    // Upsert dimension analysis entries (S/W + OA per dimension)
    if (Array.isArray(dimensionAnalysis)) {
      for (const entry of dimensionAnalysis) {
        const idx = session.dimensionAnalysis.findIndex(
          (d) => d.dimension.toString() === entry.dimension
        );
        const swItems = (entry.strengthWeaknessItems ?? []).filter(s => s?.trim());
        const oaItems = (entry.opportunityAnalysisItems ?? []).filter(s => s?.trim());
        if (idx >= 0) {
          session.dimensionAnalysis[idx].strengthWeaknessItems    = swItems;
          session.dimensionAnalysis[idx].opportunityAnalysisItems = oaItems;
        } else {
          session.dimensionAnalysis.push({
            dimension: entry.dimension,
            strengthWeaknessItems:    swItems,
            opportunityAnalysisItems: oaItems,
          });
        }
      }
    }

    // Upsert subdimension analysis entries (only expectedLevel)
    if (Array.isArray(subdimensionAnalysis)) {
      for (const entry of subdimensionAnalysis) {
        const idx = session.subdimensionAnalysis.findIndex(
          (s) => s.subdimension.toString() === entry.subdimension
        );
        const el = entry.expectedLevel != null && entry.expectedLevel !== "" ? Number(entry.expectedLevel) : null;
        if (idx >= 0) {
          session.subdimensionAnalysis[idx].expectedLevel = el;
        } else {
          session.subdimensionAnalysis.push({
            dimension:    entry.dimension,
            subdimension: entry.subdimension,
            expectedLevel: el,
          });
        }
      }
    }

    await session.save();
    res.json({ session });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─── SuperAdmin: save action plan groups ────────────────────────────────────
export const saveActionPlanGroups = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { actionPlanGroups } = req.body;
    if (!Array.isArray(actionPlanGroups)) {
      return res.status(400).json({ error: "actionPlanGroups must be an array" });
    }

    // Replace all action plan groups atomically (admin controls the full set)
    session.actionPlanGroups = actionPlanGroups.map((grp, i) => ({
      _id:          grp._id || undefined,
      label:        grp.label?.trim() ?? "",
      items:        (grp.items ?? []).filter(s => s?.trim()),
      subdimensions: grp.subdimensions ?? [],
      order:        grp.order ?? i,
    }));

    await session.save();
    res.json({ actionPlanGroups: session.actionPlanGroups });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: MONITORING COLUMNS & DATA
// ═══════════════════════════════════════════════════════════════════════════════

// ─── SuperAdmin: save monitoring columns (define/reorder adjustable columns) ──
export const saveMonitoringColumns = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { columns } = req.body;
    if (!Array.isArray(columns)) {
      return res.status(400).json({ error: "columns must be an array" });
    }

    // Replace all columns with the new set (allows reorder, add, remove)
    session.monitoringColumns = columns.map((col, i) => ({
      label:   col.label?.trim() || `Column ${i + 1}`,
      type:    col.type || "text",
      options: col.options ?? [],
      order:   col.order ?? i,
      _id:     col._id || undefined, // preserve existing IDs for stable references
    }));

    await session.save();
    res.json({ monitoringColumns: session.monitoringColumns });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─── SuperAdmin: save monitoring data (cell values per subdimension × column) ─
export const saveMonitoringData = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "data must be an array" });
    }

    // Upsert each cell (dimension + subdimension + columnId is the composite key)
    for (const cell of data) {
      if (!cell.dimension || !cell.subdimension || !cell.columnId) continue;

      const existIdx = session.monitoringData.findIndex(
        (m) =>
          m.dimension.toString() === cell.dimension &&
          m.subdimension.toString() === cell.subdimension &&
          m.columnId.toString() === cell.columnId
      );

      if (existIdx >= 0) {
        session.monitoringData[existIdx].value = cell.value ?? "";
      } else {
        session.monitoringData.push({
          dimension:    cell.dimension,
          subdimension: cell.subdimension,
          columnId:     cell.columnId,
          value:        cell.value ?? "",
        });
      }
    }

    await session.save();
    res.json({ monitoringData: session.monitoringData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─── SuperAdmin: save action-plan-based monitoring rows ───────────────────────
export const saveMonitoringRows = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { monitoringRows } = req.body;
    if (!Array.isArray(monitoringRows)) {
      return res.status(400).json({ error: "monitoringRows must be an array" });
    }

    session.monitoringRows = monitoringRows.map(r => ({
      actionPlanGroupId: r.actionPlanGroupId || undefined,
      actionPlanItemIdx: r.actionPlanItemIdx ?? 0,
      subdimension:      r.subdimension || undefined,
      timeline:          (r.timeline ?? []).filter(m => m >= 1 && m <= 12),
      pic:               r.pic?.trim() ?? "",
      checker:           r.checker?.trim() ?? "",
      achievementStatus: r.achievementStatus ?? "",
      notes:             r.notes?.trim() ?? "",
    }));

    await session.save();
    res.json({ monitoringRows: session.monitoringRows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

