"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, FolderOpen, Trash2, Tag } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";

export default function ProjectsPage() {
  const { projects, loading, createProject, deleteProject } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", tags: "" });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createProject({
        name: form.name,
        description: form.description,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Project created!");
      setShowModal(false);
      setForm({ name: "", description: "", tags: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">No projects yet</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">Create your first project to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project._id} className="card p-5 transition-colors hover:border-[var(--border-3)]">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <button
                  onClick={() => {
                    deleteProject(project._id);
                    toast.success("Project archived");
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Link href={`/dashboard/projects/${project._id}`}>
                <h3 className="font-medium text-gray-900 hover:text-brand-600 transition-colors">
                  {project.name}
                </h3>
              </Link>
              {project.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{project.description}</p>
              )}
              {project.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {project.eventLogs?.length ?? 0} event log(s) · Updated{" "}
                {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project name *
                </label>
                <input
                  className="input"
                  placeholder="e.g. Order-to-Cash Analysis"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Describe your project…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  className="input"
                  placeholder="finance, erp, SAP"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 justify-center"
                >
                  {creating ? "Creating…" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
