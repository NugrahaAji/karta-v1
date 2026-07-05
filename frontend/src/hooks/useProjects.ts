"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Project } from "@/types";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects");
      setProjects(res.data.projects);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data: {
    name: string;
    description?: string;
    tags?: string[];
  }) => {
    const res = await api.post("/projects", data);
    setProjects((prev) => [res.data.project, ...prev]);
    return res.data.project;
  };

  const deleteProject = async (id: string) => {
    await api.delete(`/projects/${id}`);
    setProjects((prev) => prev.filter((p) => p._id !== id));
  };

  return { projects, loading, error, createProject, deleteProject, refetch: fetchProjects };
}
