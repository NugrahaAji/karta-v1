import express from "express";
import { protect, requireAccountRole } from "../middleware/auth.middleware.js";
import {
  getCompanySessions, createSession, updateSession, deleteSession,
  getMySessions, getSessionDetail, submitResponse, getMyResponse,
  getSessionResults, adjustSubdimension,
  getAllSessionsAdmin, getSessionResultsAdmin,
  saveSessionAnalysis, saveActionPlanGroups,
  saveMonitoringColumns, saveMonitoringData, saveMonitoringRows,
  saveAiAnalysis, generateAiAnalysis, generateAiAnalysisCompany,
} from "../controllers/assessmentSession.controller.js";

const router = express.Router();

const companyGuard  = [protect, requireAccountRole("Company")];
const adminGuard    = [protect, requireAccountRole("superAdmin")];

// ─── SuperAdmin: all sessions + analysis + monitoring ────────────────────────
router.get("/admin",              ...adminGuard, getAllSessionsAdmin);
router.get("/admin/:id/results",  ...adminGuard, getSessionResultsAdmin);
router.patch("/admin/:id/analysis",           ...adminGuard, saveSessionAnalysis);
router.patch("/admin/:id/action-plan-groups", ...adminGuard, saveActionPlanGroups);
router.patch("/admin/:id/monitoring-columns", ...adminGuard, saveMonitoringColumns);
router.patch("/admin/:id/monitoring-data",    ...adminGuard, saveMonitoringData);
router.patch("/admin/:id/monitoring-rows",    ...adminGuard, saveMonitoringRows);
router.patch("/admin/:id/ai-analysis",        ...adminGuard, saveAiAnalysis);  // PERMANENT, sekali saja (manual save)
router.post("/admin/:id/generate-ai",         ...adminGuard, generateAiAnalysis); // AUTO-GENERATE dari engine

// ─── Company manages sessions ─────────────────────────────────────────────────
router.get("/company", ...companyGuard, getCompanySessions);
router.post("/company", ...companyGuard, createSession);
router.put("/company/:id", ...companyGuard, updateSession);
router.delete("/company/:id", ...companyGuard, deleteSession);

// ─── Company: results, adjustment & AI ───────────────────────────────────────
router.get("/company/:id/results",      ...companyGuard, getSessionResults);
router.post("/company/:id/adjust",      ...companyGuard, adjustSubdimension);
router.post("/company/:id/generate-ai", ...companyGuard, generateAiAnalysisCompany);

// ─── Member views assigned sessions ──────────────────────────────────────────
router.get("/my", protect, requireAccountRole("Company"), getMySessions);

// ─── Member: submit / get response ──────────────────────────────────────────
router.post("/:id/respond", protect, requireAccountRole("Company"), submitResponse);
router.get("/:id/my-response", protect, requireAccountRole("Company"), getMyResponse);

// ─── Shared: single session detail ───────────────────────────────────────────
router.get("/:id", protect, requireAccountRole("Company"), getSessionDetail);

export default router;
