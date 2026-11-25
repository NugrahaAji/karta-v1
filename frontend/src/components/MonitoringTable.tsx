"use client";

// Compatibility entry point shared by the company and administrator workspaces.
export { default } from "./workspace/MonitoringWorkspace";
export { buildMonRows, monRowKey } from "@/lib/monitoring";
