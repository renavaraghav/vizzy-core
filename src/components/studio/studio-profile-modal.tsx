"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import type { Project } from "@/types/domain";
import { createDDaySampleProject } from "@/lib/sample-story";

interface StudioProfileModalProps {
  isOpen: boolean;
  projects: Project[];
  selectedProject?: Project | null;
  onClose: () => void;
  onSelectProject?: (projectId: string) => void;
  onCreateProject: (custom?: Project) => void;
}

export function StudioProfileModal({
  isOpen,
  projects,
  onClose,
  onCreateProject,
}: StudioProfileModalProps) {
  const [studioName, setStudioName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vizzy:studio-name") || "Vizzy Novel Studio";
    }
    return "Vizzy Novel Studio";
  });
  const [authorName, setAuthorName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vizzy:author-name") || "Creative Director";
    }
    return "Creative Director";
  });
  const [testResult, setTestResult] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
    latencyMs?: number;
  }>({ testing: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveStudioInfo = () => {
    try {
      localStorage.setItem("vizzy:studio-name", studioName);
      localStorage.setItem("vizzy:author-name", authorName);
    } catch {
      // ignore
    }
  };

  const handleTestConnection = async () => {
    setTestResult({ testing: true });
    try {
      const res = await fetch("/api/settings", { method: "POST" });
      const data = await res.json();
      setTestResult({
        testing: false,
        success: data.success,
        message: data.status,
        latencyMs: data.latencyMs,
      });
    } catch (err) {
      setTestResult({
        testing: false,
        success: false,
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  };

  const handleExportBackup = () => {
    try {
      const data = localStorage.getItem("vizzy:studio-state");
      if (!data) return;
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vizzy-projects-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Unable to export projects backup.");
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.projects)) {
          localStorage.setItem("vizzy:studio-state", text);
          window.location.reload();
        } else {
          alert("Invalid Vizzy backup file format.");
        }
      } catch {
        alert("Failed to parse the backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const totalPages = projects.reduce(
    (sum, p) => sum + (p.storyPlan?.pageBeats?.length || 0),
    0,
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-profile-title"
        className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#161715] text-[#f5f3ef] shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#7c83da] to-[#4e536f] text-white">
              <Icon name="sparkles" size={16} />
            </span>
            <div>
              <h2 id="studio-profile-title" className="text-[14px] font-semibold text-white">
                Your Studio Profile
              </h2>
              <p className="text-[11px] text-[#868782]">
                Creator overview, active graphic novels, and system diagnostics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-[#868782] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="studio-scrollbar flex-1 overflow-y-auto p-6 space-y-6 text-[12px]">
          {/* Identity Card */}
          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#7c83da] to-[#4e536f] text-[18px] font-bold text-white shadow-lg">
              {studioName.slice(0, 2).toUpperCase() || "YS"}
            </span>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-white">{studioName}</span>
                <span className="rounded-full bg-[#777fd7]/15 px-2 py-0.5 text-[9px] font-medium text-[#aeb3ef]">
                  Active Studio
                </span>
              </div>
              <p className="text-[11px] text-[#868782]">
                Directed by {authorName} · {projects.length} Graphic Novels · {totalPages} Total Pages
              </p>
            </div>
          </div>

          {/* Editable Names */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#868782]">Studio Name</label>
              <input
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                onBlur={handleSaveStudioInfo}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-[#777fd7]/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#868782]">Author / Director</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                onBlur={handleSaveStudioInfo}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-[#777fd7]/50"
              />
            </div>
          </div>

          {/* System Diagnostics */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#868782]">
                System Diagnostics
              </h4>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testResult.testing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#777fd7]/30 bg-[#777fd7]/10 px-2.5 py-1 text-[10px] font-medium text-[#aeb3ef] hover:bg-[#777fd7]/20 disabled:opacity-50"
              >
                <Icon
                  name={testResult.testing ? "refresh" : "sparkles"}
                  size={12}
                  className={testResult.testing ? "animate-spin" : ""}
                />
                {testResult.testing ? "Testing..." : "Test Cloudflare AI"}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5 text-[11px]">
              <div className="rounded-xl bg-black/30 p-2.5 border border-white/[0.04]">
                <span className="text-[#868782]">Cloudflare AI</span>
                <p className="mt-1 font-medium text-emerald-400">FLUX Schnell</p>
              </div>
              <div className="rounded-xl bg-black/30 p-2.5 border border-white/[0.04]">
                <span className="text-[#868782]">Offline Engine</span>
                <p className="mt-1 font-medium text-emerald-400">Sharp + Ink</p>
              </div>
              <div className="rounded-xl bg-black/30 p-2.5 border border-white/[0.04]">
                <span className="text-[#868782]">Storage</span>
                <p className="mt-1 font-medium text-emerald-400">LocalStorage</p>
              </div>
            </div>

            {testResult.message && (
              <div
                className={`mt-3 flex items-center justify-between rounded-xl p-2.5 text-[11px] ${
                  testResult.success
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border border-red-500/20 bg-red-500/10 text-red-300"
                }`}
              >
                <span>
                  {testResult.success ? "✓" : "⚠"} {testResult.message}
                </span>
                {testResult.latencyMs && (
                  <span className="font-mono text-[10px] opacity-80">{testResult.latencyMs}ms</span>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#868782]">
              Quick Actions
            </h4>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onCreateProject(createDDaySampleProject());
                  onClose();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#777fd7]/30 bg-[#777fd7]/15 px-3.5 py-2 text-[11px] font-semibold text-[#aeb3ef] transition-colors hover:bg-[#777fd7]/25"
              >
                <Icon name="sparkles" size={14} />
                Load D-Day Demo Project
              </button>
              <button
                type="button"
                onClick={() => {
                  onCreateProject();
                  onClose();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-white/[0.09]"
              >
                <Icon name="plus" size={14} />
                Start Blank Project
              </button>
            </div>
          </div>

          {/* Backup / Export */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">Project Backup</h4>
              <p className="text-[11px] text-[#868782]">
                Export or import your graphic novel data as JSON
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/[0.09]"
              >
                <Icon name="download" size={13} />
                Export
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#777fd7]/30 bg-[#777fd7]/10 px-3 py-1.5 text-[11px] font-medium text-[#aeb3ef] hover:bg-[#777fd7]/20"
              >
                Import
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.02] px-6 py-3.5 text-[11px] text-[#868782]">
          <span>Vizzy AI Creative Studio · v0.1.0 MVP</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/[0.08] px-4 py-1.5 font-medium text-white transition-colors hover:bg-white/[0.14]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
