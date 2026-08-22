import AssessmentSession from "../models/assessmentSession.model.js";
import AssessmentResponse from "../models/assessmentResponse.model.js";
import User from "../models/user.model.js";
import Dimension from "../models/dimension.model.js";
import { batchAnalyze } from "../services/ai.service.js";

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY: SESSION CRUD
// ═══════════════════════════════════════════════════════════════════════════════

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

export const createSession = async (req, res) => {
  try {
    const { title, description, assignedTo, dimensions, status, startDate, endDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

    if (assignedTo?.length) {
      const members = await User.find({ _id: { $in: assignedTo }, createdBy: req.user._id });
      if (members.length !== assignedTo.length)
        return res.status(400).json({ error: "Some assigned members do not belong to your company" });
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

export const deleteSession = async (req, res) => {
  try {
    const session = await AssessmentSession.findOneAndDelete({ _id: req.params.id, company: req.user._id });
    if (!session) return res.status(404).json({ error: "Session not found" });
    await AssessmentResponse.deleteMany({ session: session._id });
    res.json({ message: "Session deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER: SESSIONS & RESPONSES
// ═══════════════════════════════════════════════════════════════════════════════

export const getMySessions = async (req, res) => {
  try {
    const rawAllowed = req.user.allowedDimensions ?? [];
    const memberAllowedIds = rawAllowed.map(d => d._id ?? d);

    const query = {
      assignedTo: req.user._id,
      status: { $ne: "cancelled" },
    };

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

export const getSessionDetail = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("company", "name email");

    if (!session) return res.status(404).json({ error: "Session not found" });

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

export const submitResponse = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const isAssigned = session.assignedTo.some(m => m.toString() === req.user._id.toString());
    if (!isAssigned) return res.status(403).json({ error: "You are not assigned to this session" });

    if (session.status !== "active")
      return res.status(400).json({ error: "Session is not active" });

    const { responses } = req.body;
    if (!responses || !Array.isArray(responses) || responses.length === 0)
      return res.status(400).json({ error: "Responses are required" });

    for (const r of responses) {
      if (!r.dimension || !r.subdimension || !r.selectedLevel || r.selectedLevelIndex === undefined)
        return res.status(400).json({ error: "Each response must have dimension, subdimension, selectedLevel, and selectedLevelIndex" });
    }

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
      { session: session._id, user: req.user._id, responses: mappedResponses, submittedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ response });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getMyResponse = async (req, res) => {
  try {
    const response = await AssessmentResponse.findOne({ session: req.params.id, user: req.user._id });
    res.json({ response: response ?? null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY: RESULTS & ADJUSTMENT
// ═══════════════════════════════════════════════════════════════════════════════

export const getSessionResults = async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({ _id: req.params.id, company: req.user._id })
      .populate("assignedTo", "name email role")
      .populate("finalScores.adjustedBy", "name email");

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

export const adjustSubdimension = async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({ _id: req.params.id, company: req.user._id });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { dimension, subdimension, finalLevelIndex } = req.body;
    if (!dimension || !subdimension || finalLevelIndex === undefined)
      return res.status(400).json({ error: "dimension, subdimension, and finalLevelIndex are required" });

    // ── Load semua responses untuk hitung majority seluruh sub-dimensi ──────
    const allResponses = await AssessmentResponse.find({ session: session._id });

    // Build answersMap { "dimId__subId": [levelIndex, ...] }
    const answersMap = {};
    for (const resp of allResponses) {
      for (const item of resp.responses) {
        const key = `${item.dimension}__${item.subdimension}`;
        if (!answersMap[key]) answersMap[key] = [];
        answersMap[key].push(item.selectedLevelIndex);
      }
    }

    function getMode(arr) {
      if (!arr.length) return null;
      const freq = {};
      let maxFreq = 0, modeVal = arr[0];
      for (const v of arr) {
        freq[v] = (freq[v] ?? 0) + 1;
        if (freq[v] > maxFreq) { maxFreq = freq[v]; modeVal = v; }
      }
      return modeVal;
    }

    // Build map existing finalScores untuk lookup cepat
    const finalMap = {};
    for (const fs of session.finalScores) {
      finalMap[`${fs.dimension}__${fs.subdimension}`] = fs;
    }

    // ── Upsert semua sub-dimensi yang punya data majority ke finalScores ──
    for (const [key, votes] of Object.entries(answersMap)) {
      const [dimId, subId] = key.split("__");
      const majorityIdx = getMode(votes);
      if (majorityIdx === null || majorityIdx === undefined) continue;

      const existing = finalMap[key];
      if (!existing) {
        // Belum ada entry → tambahkan dengan source 'majority'
        session.finalScores.push({
          dimension:       dimId,
          subdimension:    subId,
          finalLevelIndex: majorityIdx,
          source:          "majority",
        });
        finalMap[key] = { source: "majority" };
      } else if (existing.source === "majority") {
        // Update majority (nilai mungkin berubah jika ada jawaban baru)
        const idx = session.finalScores.findIndex(
          f => f.dimension.toString() === dimId && f.subdimension.toString() === subId
        );
        if (idx >= 0) session.finalScores[idx].finalLevelIndex = majorityIdx;
      }
      // Jika source === 'adjusted', biarkan — tidak di-overwrite oleh majority
    }

    // ── Override / tambah entry untuk subdimensi yang di-adjust manual ────
    const adjKey = `${dimension}__${subdimension}`;
    const adjIdx = session.finalScores.findIndex(
      f => f.dimension.toString() === dimension && f.subdimension.toString() === subdimension
    );

    const adjustedEntry = {
      dimension,
      subdimension,
      finalLevelIndex,
      source:      "adjusted",
      adjustedBy:  req.user._id,
      adjustedAt:  new Date(),
    };

    if (adjIdx >= 0) session.finalScores[adjIdx] = adjustedEntry;
    else             session.finalScores.push(adjustedEntry);

    await session.save();
    const populated = await session.populate("finalScores.adjustedBy", "name email");
    res.json({ session: populated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: VIEW ALL SESSIONS & SAVE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

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

export const getSessionResultsAdmin = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id)
      .populate("company", "name email")
      .populate("assignedTo", "name email role")
      .populate("finalScores.adjustedBy", "name email");

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

export const saveSessionAnalysis = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { dimensionAnalysis, subdimensionAnalysis } = req.body;

    if (Array.isArray(dimensionAnalysis)) {
      for (const entry of dimensionAnalysis) {
        const idx = session.dimensionAnalysis.findIndex(d => d.dimension.toString() === entry.dimension);
        const swItems = (entry.strengthWeaknessItems ?? []).filter(s => s?.trim());
        const oaItems = (entry.opportunityAnalysisItems ?? []).filter(s => s?.trim());
        if (idx >= 0) {
          session.dimensionAnalysis[idx].strengthWeaknessItems    = swItems;
          session.dimensionAnalysis[idx].opportunityAnalysisItems = oaItems;
        } else {
          session.dimensionAnalysis.push({ dimension: entry.dimension, strengthWeaknessItems: swItems, opportunityAnalysisItems: oaItems });
        }
      }
    }

    if (Array.isArray(subdimensionAnalysis)) {
      for (const entry of subdimensionAnalysis) {
        const idx = session.subdimensionAnalysis.findIndex(s => s.subdimension.toString() === entry.subdimension);
        const el = entry.expectedLevel != null && entry.expectedLevel !== "" ? Number(entry.expectedLevel) : null;
        if (idx >= 0) {
          session.subdimensionAnalysis[idx].expectedLevel = el;
        } else {
          session.subdimensionAnalysis.push({ dimension: entry.dimension, subdimension: entry.subdimension, expectedLevel: el });
        }
      }
    }

    await session.save();
    res.json({ session });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const saveAiAnalysis = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.aiAnalysisLocked)
      return res.status(409).json({ error: "AI analysis sudah pernah di-generate.", aiGeneratedAt: session.aiGeneratedAt });

    const { aiAnalysis } = req.body;
    if (!Array.isArray(aiAnalysis) || aiAnalysis.length === 0)
      return res.status(400).json({ error: "aiAnalysis harus berupa array dan tidak boleh kosong." });

    session.aiAnalysis       = aiAnalysis;
    session.aiGeneratedAt    = new Date();
    session.aiAnalysisLocked = true;
    await session.save();

    res.json({ message: "AI analysis berhasil disimpan.", aiGeneratedAt: session.aiGeneratedAt, itemCount: aiAnalysis.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const saveActionPlanGroups = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { actionPlanGroups } = req.body;
    if (!Array.isArray(actionPlanGroups))
      return res.status(400).json({ error: "actionPlanGroups must be an array" });

    session.actionPlanGroups = actionPlanGroups.map((grp, i) => ({
      _id:           grp._id || undefined,
      label:         grp.label?.trim() ?? "",
      items:         (grp.items ?? []).filter(s => s?.trim()),
      subdimensions: grp.subdimensions ?? [],
      order:         grp.order ?? i,
    }));

    await session.save();
    res.json({ actionPlanGroups: session.actionPlanGroups });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: MONITORING
// ═══════════════════════════════════════════════════════════════════════════════

export const saveMonitoringColumns = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { columns } = req.body;
    if (!Array.isArray(columns)) return res.status(400).json({ error: "columns must be an array" });

    session.monitoringColumns = columns.map((col, i) => ({
      label:   col.label?.trim() || `Column ${i + 1}`,
      type:    col.type || "text",
      options: col.options ?? [],
      order:   col.order ?? i,
      _id:     col._id || undefined,
    }));

    await session.save();
    res.json({ monitoringColumns: session.monitoringColumns });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const saveMonitoringData = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { data } = req.body;
    if (!Array.isArray(data)) return res.status(400).json({ error: "data must be an array" });

    for (const cell of data) {
      if (!cell.dimension || !cell.subdimension || !cell.columnId) continue;
      const existIdx = session.monitoringData.findIndex(
        m => m.dimension.toString() === cell.dimension &&
             m.subdimension.toString() === cell.subdimension &&
             m.columnId.toString() === cell.columnId
      );
      if (existIdx >= 0) session.monitoringData[existIdx].value = cell.value ?? "";
      else session.monitoringData.push({ dimension: cell.dimension, subdimension: cell.subdimension, columnId: cell.columnId, value: cell.value ?? "" });
    }

    await session.save();
    res.json({ monitoringData: session.monitoringData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const saveMonitoringRows = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { monitoringRows } = req.body;
    if (!Array.isArray(monitoringRows)) return res.status(400).json({ error: "monitoringRows must be an array" });

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

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED: AI REASONING — CORE LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * _runAiGeneration — shared helper dipakai oleh Admin & Company.
 * Membangun payload, kirim 202 langsung, lalu proses LLM di background.
 *
 * @param {Object} session       - Mongoose session document (sudah diload & verified ownership)
 * @param {Object} req           - Express request
 * @param {Object} res           - Express response
 * @param {string} pollUrlPrefix - e.g. "/api/sessions/admin" atau "/api/sessions/company"
 */
async function _runAiGeneration(session, req, res, pollUrlPrefix) {
  if (session.aiAnalysisLocked) {
    return res.status(409).json({
      error:         "AI analysis sudah pernah di-generate untuk sesi ini.",
      aiGeneratedAt: session.aiGeneratedAt,
    });
  }

  // Load responses
  const allResponses = await AssessmentResponse.find({ session: session._id });
  if (allResponses.length === 0) {
    return res.status(400).json({
      error: "Tidak ada response yang tersedia. Pastikan semua member sudah mengisi assessment.",
    });
  }

  // Load dimensions
  const dimIds = session.dimensions?.length > 0 ? session.dimensions : null;
  const dims = dimIds
    ? await Dimension.find({ _id: { $in: dimIds } }).sort({ name: 1 })
    : await Dimension.find().sort({ name: 1 });

  // Build finalScoresMap dari session.finalScores (majority + adjusted)
  // Key: "dimId__subId" → finalLevelIndex
  const finalScoresMap = {};
  for (const fs of session.finalScores ?? []) {
    finalScoresMap[`${fs.dimension}__${fs.subdimension}`] = fs.finalLevelIndex;
  }

  const expectedMap = {};
  for (const sa of session.subdimensionAnalysis ?? []) {
    expectedMap[`${sa.dimension}__${sa.subdimension}`] = sa.expectedLevel;
  }

  // Mode helper (untuk fallback jika finalScores belum dihitung)
  function getMode(arr) {
    if (!arr.length) return null;
    const freq = {};
    let maxFreq = 0, modeVal = arr[0];
    for (const v of arr) {
      freq[v] = (freq[v] ?? 0) + 1;
      if (freq[v] > maxFreq) { maxFreq = freq[v]; modeVal = v; }
    }
    return modeVal;
  }

  // Answers map (untuk fallback & catatan)
  const answersMap = {};
  for (const resp of allResponses) {
    for (const item of resp.responses) {
      const key = `${item.dimension}__${item.subdimension}`;
      if (!answersMap[key]) answersMap[key] = [];
      answersMap[key].push(item.selectedLevelIndex);
    }
  }

  // Build payload
  const assessments = [];
  for (const dim of dims) {
    const dimObj = dim.toObject();
    for (const sub of dimObj.subdimensions ?? []) {
      const key = `${dim._id}__${sub._id}`;

      const levelDefs = {};
      for (let li = 0; li < (sub.levels ?? []).length; li++) {
        levelDefs[String(li)] = sub.levels[li].name ?? `Level ${li + 1}`;
      }

      // Prioritas: finalScores (majority/adjusted) → fallback ke modus responses langsung
      const finalLevelIndex = finalScoresMap[key] !== undefined
        ? finalScoresMap[key]
        : getMode(answersMap[key] ?? []);

      if (finalLevelIndex === null || finalLevelIndex === undefined) continue;

      const finalResult   = finalLevelIndex + 1;
      const expectedLevel = expectedMap[key] ?? (sub.levels?.length ?? 1);

      const notes = allResponses
        .flatMap(r => r.responses)
        .filter(item =>
          item.dimension.toString()    === dim._id.toString() &&
          item.subdimension.toString() === sub._id.toString() &&
          item.note?.trim()
        )
        .map(item => item.note.trim())
        .join(" | ");

      assessments.push({
        dimension:         dim.name,
        sub_dimension:     sub.name,
        final_result:      finalResult,
        expected_level:    expectedLevel,
        assessment_note:   notes || null,
        level_definitions: levelDefs,
      });
    }
  }

  if (assessments.length === 0) {
    return res.status(400).json({ error: "Tidak ada sub-dimensi dengan data respons yang valid." });
  }

  // Provider: opsional sesuai panduan (server default: Llama-3.3-70B-Instruct)
  const providerOverride = req.body?.provider ?? null;

  // Organization: ambil dari body, atau auto-populate dari nama company di session
  // Sesuai panduan: { name, sector } untuk konteks LLM
  let organization = req.body?.organization ?? null;
  if (!organization) {
    try {
      const companyUser = await User.findById(session.company).select("name").lean();
      if (companyUser?.name) {
        organization = { name: companyUser.name };
      }
    } catch (_) { /* fallback ke null */ }
  }

  const sessionId = session._id;

  // Balas 202 langsung — hindari gateway timeout
  res.status(202).json({
    message:      "AI analysis sedang diproses di background. Poll endpoint results untuk melihat status.",
    sessionId:    sessionId.toString(),
    totalItems:   assessments.length,
    organization: organization?.name ?? null,
    pollUrl:      `${pollUrlPrefix}/${sessionId}/results`,
  });

  // Background job
  (async () => {
    try {
      console.log(`[AI] Memulai generate session ${sessionId} (${assessments.length} item, org: ${organization?.name ?? "-"})...`);

      const results = await batchAnalyze(assessments, organization, providerOverride);

      const aiAnalysis = results.map((result, idx) => ({
        dimension:            assessments[idx]?.dimension,
        sub_dimension:        assessments[idx]?.sub_dimension,
        final_result:         assessments[idx]?.final_result,
        expected_level:       assessments[idx]?.expected_level,
        classification:       result.classification,
        strength_weakness:    result.strength_weakness,
        opportunity_analysis: result.opportunity_analysis,
        action_plan:          result.action_plan,
        meta:                 result.meta ?? {},
      }));

      const freshSession = await AssessmentSession.findById(sessionId);
      if (freshSession && !freshSession.aiAnalysisLocked) {
        freshSession.aiAnalysis       = aiAnalysis;
        freshSession.aiGeneratedAt    = new Date();
        freshSession.aiAnalysisLocked = true;
        await freshSession.save();
        console.log(`[AI] ✅ Selesai — ${aiAnalysis.length} item disimpan untuk session ${sessionId}`);
      }
    } catch (bgErr) {
      console.error(`[AI] ❌ Background error session ${sessionId}:`, bgErr.message);
      try {
        await AssessmentSession.findByIdAndUpdate(sessionId, {
          aiAnalysis:    [{ _error: bgErr.message }],
          aiGeneratedAt: new Date(),
        });
      } catch (_) { /* ignore */ }
    }
  })();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: GENERATE AI ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/sessions/admin/:id/generate-ai
 * SuperAdmin dapat men-trigger AI generation untuk sesi apapun.
 */
export const generateAiAnalysis = async (req, res) => {
  try {
    const session = await AssessmentSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    await _runAiGeneration(session, req, res, "/api/sessions/admin");
  } catch (e) {
    console.error("[generateAiAnalysis]", e);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY: GENERATE AI ANALYSIS (sesi milik sendiri)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/sessions/company/:id/generate-ai
 *
 * Company men-trigger AI reasoning untuk sesi MEREKA SENDIRI.
 * Ownership check via `company: req.user._id`.
 * Hasil dapat dilihat di GET /api/sessions/company/:id/results
 * pada field session.aiAnalysis setelah aiAnalysisLocked = true.
 */
export const generateAiAnalysisCompany = async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({
      _id:     req.params.id,
      company: req.user._id,
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    await _runAiGeneration(session, req, res, "/api/sessions/company");
  } catch (e) {
    console.error("[generateAiAnalysisCompany]", e);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
};
