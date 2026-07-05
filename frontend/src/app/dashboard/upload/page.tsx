"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { useProjects } from "@/hooks/useProjects";
import clsx from "clsx";

const ACCEPTED = [".xes", ".csv", ".xlsx"];

export default function UploadPage() {
  const { projects } = useProjects();
  const [file, setFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !projectId) return toast.error("Select a project and file");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);
    formData.append("name", file.name);

    setUploading(true);
    try {
      await api.post("/event-logs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDone(true);
      toast.success("Event log uploaded! Processing started.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Upload successful!</h2>
        <p className="text-sm text-gray-500 mb-6">Your event log is being processed.</p>
        <button onClick={() => { setFile(null); setDone(false); }} className="btn-primary">
          Upload another
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Upload Event Log</h1>
      <p className="text-sm text-gray-500 mb-8">
        Supported formats: XES, CSV, XLSX
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Project *
          </label>
          <select
            className="input"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Event Log File *
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={clsx(
              "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors",
              dragging
                ? "border-brand-400 bg-brand-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-brand-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">XES, CSV, XLSX up to 50MB</p>
              </>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || !file || !projectId}
          className="btn-primary w-full justify-center"
        >
          {uploading ? "Uploading…" : "Upload Event Log"}
        </button>
      </form>
    </div>
  );
}
