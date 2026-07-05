export interface User {
  _id: string;
  name: string;
  email: string;
  role: "superAdmin" | "owner" | "admin" | "member";
  accountRole: "superAdmin" | "Company" | "Consultant" | "Researcher" | "PM";
  plan: "free" | "pro" | "enterprise" | "researcher_plan";
  avatar?: string;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  createdBy?: string; // present if account was created by a company
  allowedDimensions?: { _id: string; name: string; detail: string }[];
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  owner: User;
  members: { user: User; role: "viewer" | "editor" | "admin" }[];
  eventLogs: EventLog[];
  status: "active" | "archived";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EventLog {
  _id: string;
  name: string;
  project: string;
  uploadedBy: User;
  fileUrl: string;
  fileSize: number;
  fileType: "xes" | "csv" | "xlsx";
  status: "uploaded" | "processing" | "ready" | "error";
  stats: {
    totalCases: number;
    totalEvents: number;
    totalActivities: number;
    startDate?: string;
    endDate?: string;
  };
  miningResults: MiningResult[];
  createdAt: string;
}

export interface MiningResult {
  _id: string;
  eventLog: string;
  algorithm: "alpha" | "inductive" | "heuristic" | "dfg";
  status: "pending" | "running" | "done" | "error";
  petriNet?: object;
  dfg?: object;
  fitness?: number;
  precision?: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: { msg: string; path: string }[];
}

// ─── Dimension Types ─────────────────────────────────────────────────────────
export interface Criteria {
  _id: string;
  name: string;
  detail: string;
  bobot: number;
}

export interface Level {
  _id: string;
  name: string;
  detail: string;
  criteria: Criteria[];
}

export interface SubDimension {
  _id: string;
  name: string;
  detail: string;
  levels: Level[];
}

export interface Dimension {
  _id: string;
  name: string;
  detail: string;
  subdimensions: SubDimension[];
  createdAt: string;
  updatedAt: string;
}

// ─── Company Member Types ─────────────────────────────────────────────────────
export interface CompanyMember {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  accountRole: string;
  isActive: boolean;
  isVerified: boolean;
  plan: string;
  createdAt: string;
  allowedDimensions: { _id: string; name: string; detail: string }[];
}

// ─── Assessment Session Types ─────────────────────────────────────────────────
export type SessionStatus = "draft" | "scheduled" | "active" | "completed" | "cancelled";

export interface Adjustment {
  dimension: string;
  subdimension: string;
  finalLevelIndex: number;
  adjustedBy?: { _id: string; name: string; email: string };
  adjustedAt?: string;
}

export interface DimensionAnalysis {
  dimension: string;
  strengthWeaknessItems: string[];
  opportunityAnalysisItems: string[];
}

export interface ActionPlanGroup {
  _id?: string;
  label: string;           // optional label for the group
  items: string[];         // numbered action plan steps
  subdimensions: string[]; // IDs of subdimensions this plan covers
  order: number;
}

export interface SubdimensionAnalysis {
  dimension: string;
  subdimension: string;
  expectedLevel: number | null;
}

export interface MonitoringColumn {
  _id: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "checkbox";
  options: string[];
  order: number;
}

export interface MonitoringCell {
  dimension: string;
  subdimension: string;
  columnId: string;
  value: string | number | boolean;
}

export interface MonitoringRow {
  _id?: string;
  actionPlanGroupId?: string;
  actionPlanItemIdx: number;
  subdimension?: string;
  timeline: number[];
  pic: string;
  checker: string;
  achievementStatus: "" | "Not Started" | "Ongoing" | "Completed" | "Delayed";
  notes: string;
}

export interface AssessmentSession {
  _id: string;
  title: string;
  description: string;
  company: { _id: string; name: string; email: string };
  assignedTo: { _id: string; name: string; email: string; role: string }[];
  dimensions: string[];
  status: SessionStatus;
  startDate?: string;
  endDate?: string;
  adjustments?: Adjustment[];
  dimensionAnalysis?: DimensionAnalysis[];
  actionPlanGroups?: ActionPlanGroup[];
  subdimensionAnalysis?: SubdimensionAnalysis[];
  monitoringColumns?: MonitoringColumn[];
  monitoringData?: MonitoringCell[];
  monitoringRows?: MonitoringRow[];
  createdAt: string;
  updatedAt: string;
}

// ─── Assessment Response Types ────────────────────────────────────────────────
export interface ResponseItem {
  dimension: string;
  subdimension: string;
  selectedLevel: string;
  selectedLevelIndex: number;
  selectedCriteria?: string; // specific criteria card chosen (for visual restore)
  note?: string;             // optional note from the member
}

export interface AssessmentResponse {
  _id: string;
  session: string;
  user: { _id: string; name: string; email: string; role: string };
  responses: ResponseItem[];
  submittedAt: string;
}
