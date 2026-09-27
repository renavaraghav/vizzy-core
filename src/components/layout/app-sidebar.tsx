"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { LogoMark } from "@/components/ui/logo-mark";
import { SidebarItem } from "@/components/ui/sidebar-item";
import type { StudioView } from "@/hooks/use-project-store";
import type { Project } from "@/types/domain";
import { getUserProfile } from "@/lib/profile-storage";
import { createDDaySampleProject } from "@/lib/sample-story";

const navigation: Array<{
  icon: "story" | "palette" | "characters" | "pages" | "slideshow";
  label: string;
  view: StudioView;
}> = [
  { icon: "story", label: "Story", view: "story" },
  { icon: "palette", label: "Style Bible", view: "style_bible" },
  { icon: "characters", label: "Characters", view: "characters" },
  { icon: "pages", label: "Pages", view: "pages" },
  { icon: "slideshow", label: "Slideshow", view: "slideshow" },
];

interface AppSidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  activeView: StudioView;
  onCreateProject: (custom?: Project) => void;
  onSelectProject: (projectId: string) => void;
  onSelectView: (view: StudioView) => void;
  onOpenSettings: () => void;
  onOpenStudioProfile: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function getInitials(title: string) {
  return (
    title
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "US"
  );
}

export function AppSidebar({
  projects,
  selectedProject,
  activeView,
  onCreateProject,
  onSelectProject,
  onSelectView,
  onOpenSettings,
  onOpenStudioProfile,
  collapsed = false,
  onToggleCollapse,
}: AppSidebarProps) {
  const userProfile = getUserProfile();

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearching) {
      searchInputRef.current?.focus();
    }
  }, [isSearching]);

  const isSearchingActive = !collapsed && isSearching;
  const normalizedQuery = (isSearchingActive ? searchQuery : "").trim().toLowerCase();
  const displayProjects = useMemo(() => {
    if (!isSearchingActive || !normalizedQuery) return projects;
    return projects.filter((project) =>
      project.title.toLowerCase().includes(normalizedQuery),
    );
  }, [projects, isSearchingActive, normalizedQuery]);

  return (
    <aside
      className={`flex h-dvh min-h-[600px] flex-col border-r border-white/[0.055] bg-[#151614] select-none transition-all duration-200 ease-in-out max-[760px]:hidden ${
        collapsed ? "w-[60px] p-2" : "w-[240px] max-[1180px]:w-[210px] p-3"
      }`}
    >
      {/* 1. TOP BRAND AREA */}
      <div className="shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="grid h-8 w-8 place-items-center rounded-lg text-[#777873] hover:bg-white/[0.08] hover:text-[#d5d4cf] transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <Icon name="sidebar" size={17} />
            </button>
            <div
              title="vizzy"
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={onToggleCollapse}
            >
              <LogoMark size={24} />
            </div>
            <button
              type="button"
              onClick={() => {
                onToggleCollapse?.();
                setIsSearching(true);
              }}
              className="grid h-8 w-8 place-items-center rounded-lg text-[#777873] hover:bg-white/[0.08] hover:text-[#d5d4cf] transition-colors cursor-pointer"
              title="Search stories"
              aria-label="Search stories"
            >
              <Icon name="search" size={15} />
            </button>
          </div>
        ) : (
          <div className="flex h-9 items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <LogoMark size={24} />
              <span className="text-[16px] font-semibold tracking-[-0.025em] text-[#f5f3ef]">
                vizzy
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsSearching((prev) => {
                    if (prev) setSearchQuery("");
                    return !prev;
                  });
                }}
                className={`grid h-8 w-8 place-items-center rounded-lg transition-colors cursor-pointer ${
                  isSearching
                    ? "bg-white/[0.1] text-white"
                    : "text-[#777873] hover:bg-white/[0.08] hover:text-[#d5d4cf]"
                }`}
                title="Search stories"
                aria-label="Search stories"
              >
                <Icon name="search" size={16} />
              </button>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="grid h-8 w-8 place-items-center rounded-lg text-[#777873] hover:bg-white/[0.08] hover:text-[#d5d4cf] transition-colors cursor-pointer"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <Icon name="sidebar" size={17} />
              </button>
            </div>
          </div>
        )}

        {/* Search Field when isSearching is active */}
        {isSearchingActive && (
          <div className="mt-2.5 px-0.5">
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-[#74756f] pointer-events-none">
                <Icon name="search" size={13} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setSearchQuery("");
                    setIsSearching(false);
                  }
                }}
                placeholder="Search stories..."
                className="w-full rounded-lg border border-white/[0.09] bg-white/[0.04] py-1.5 pl-8 pr-7 text-[11px] text-[#deddd8] placeholder-[#6e706a] outline-none focus:border-[#777fd7]/50 focus:bg-white/[0.07] transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 grid h-4 w-4 place-items-center rounded-full text-[#74756f] hover:bg-white/[0.1] hover:text-[#d5d4cf] transition-colors cursor-pointer"
                  title="Clear search"
                  aria-label="Clear query"
                >
                  <Icon name="close" size={11} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {collapsed ? (
          <div className="mt-3 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => onCreateProject()}
              className="grid h-9 w-9 place-items-center rounded-xl bg-[#777fd7] text-white shadow-[0_4px_14px_rgba(105,113,205,.25)] hover:bg-[#858dde] transition-colors cursor-pointer"
              title="New project"
              aria-label="New project"
            >
              <Icon name="plus" size={16} />
            </button>
            <button
              type="button"
              onClick={() => onCreateProject(createDDaySampleProject())}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#777fd7]/30 bg-[#777fd7]/10 text-[#b9bdf0] hover:bg-[#777fd7]/20 transition-colors cursor-pointer"
              title="Load D-Day Demo"
              aria-label="Load D-Day Demo"
            >
              <Icon name="sparkles" size={14} />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onCreateProject()}
              className="mt-3.5 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#777fd7] px-3 text-[11px] font-semibold text-white shadow-[0_4px_14px_rgba(105,113,205,.22)] transition-colors hover:bg-[#858dde] cursor-pointer"
              title="New project"
            >
              <Icon name="plus" size={15} />
              <span>New project</span>
            </button>

            <button
              type="button"
              onClick={() => onCreateProject(createDDaySampleProject())}
              className="mt-2 flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-[#777fd7]/30 bg-[#777fd7]/10 px-3 text-[10px] font-medium text-[#b9bdf0] transition-colors hover:bg-[#777fd7]/20 cursor-pointer"
              title="Load D-Day Demo"
            >
              <Icon name="sparkles" size={13} />
              <span>Load D-Day Demo</span>
            </button>
          </>
        )}
      </div>

      {/* 2. & 3. PROJECTS SECTION (Independently scrollable) */}
      <div className="mt-3.5 flex flex-1 min-h-[90px] flex-col min-h-0 overflow-hidden border-t border-white/[0.05] pt-2.5">
        {!collapsed && (
          <div className="flex shrink-0 items-center justify-between px-2 mb-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#555651]">
              {normalizedQuery ? "Search Results" : "Projects"}
            </span>
            <span className="rounded-full bg-white/[0.05] px-1.5 py-0.2 text-[8px] text-[#6e7069]">
              {displayProjects.length}
            </span>
          </div>
        )}

        <div className="studio-scrollbar flex-1 min-h-0 space-y-1 overflow-y-auto pr-0.5">
          {displayProjects.length === 0 ? (
            !collapsed && (
              <p className="px-2 py-4 text-center text-[10px] leading-relaxed text-[#74756f]">
                {normalizedQuery
                  ? "No stories found"
                  : "Create a project to begin."}
              </p>
            )
          ) : (
            displayProjects.map((project, index) => {
              const isSelected = project.id === selectedProject?.id;

              if (collapsed) {
                return (
                  <button
                    key={`${project.id}-${index}`}
                    type="button"
                    onClick={() => onSelectProject(project.id)}
                    className={`grid h-8 w-8 place-items-center rounded-lg transition-colors mx-auto cursor-pointer ${
                      isSelected
                        ? "bg-[#777fd7]/25 text-[#c2c6f6] ring-1 ring-[#777fd7]/40"
                        : "bg-[#252623] text-[#777873] hover:bg-white/[0.06] hover:text-[#d5d4cf]"
                    }`}
                    title={project.title}
                  >
                    <span className="text-[8px] font-semibold">
                      {getInitials(project.title)}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={`${project.id}-${index}`}
                  type="button"
                  onClick={() => onSelectProject(project.id)}
                  className={`group flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left transition-colors cursor-pointer ${
                    isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                  }`}
                  title={project.title}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-[6px] text-[8px] font-semibold ${
                      isSelected
                        ? "bg-[#777fd7]/25 text-[#c2c6f6]"
                        : "bg-[#252623] text-[#777873] group-hover:text-[#a0a29c]"
                    }`}
                  >
                    {getInitials(project.title)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[11px] ${
                        isSelected
                          ? "font-semibold text-white"
                          : "font-normal text-[#cac9c4] group-hover:text-white"
                      }`}
                    >
                      {project.title}
                    </span>
                    <span className="block truncate text-[8px] text-[#61625d]">
                      {project.onboarding.status === "complete"
                        ? "Direction ready"
                        : "Onboarding"}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. & 3. WORKSPACE SECTION (Pinned, never pushed out of view) */}
      <div className="shrink-0 mt-2.5 pt-2.5 border-t border-white/[0.05]">
        {!collapsed && (
          <div className="px-2 mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#555651]">
            Workspace
          </div>
        )}
        <nav className="space-y-0.5" aria-label="Project navigation">
          {navigation.map((item) => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
              badge={
                item.view === "pages"
                  ? String(
                      selectedProject?.storyPlan?.status === "approved"
                        ? selectedProject.storyPlan.pageBeats.length
                        : 0,
                    )
                  : undefined
              }
              active={
                activeView === item.view ||
                (item.view === "pages" && activeView === "page_creation")
              }
              onClick={() => onSelectView(item.view)}
            />
          ))}
          <SidebarItem
            icon="settings"
            label="Settings"
            collapsed={collapsed}
            active={activeView === "settings"}
            onClick={onOpenSettings}
          />
        </nav>
      </div>

      {/* 4. BOTTOM STUDIO / ACCOUNT AREA (Anchored at the bottom) */}
      <div className="shrink-0 mt-auto pt-2.5 border-t border-white/[0.05]">
        {collapsed ? (
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={onOpenStudioProfile}
              className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#7c83da] to-[#4e536f] text-[10px] font-semibold text-white shadow-sm transition-transform hover:scale-105 cursor-pointer ${
                activeView === "profile" ? "ring-2 ring-[#7c83da]" : ""
              }`}
              title={`${userProfile.displayName || "Your studio"} (Cloudflare AI Active)`}
              aria-label="Studio Profile"
            >
              {userProfile.avatarInitials || "YS"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenStudioProfile}
            className={`group flex w-full items-center gap-2.5 rounded-xl p-1.5 transition-colors cursor-pointer ${
              activeView === "profile"
                ? "bg-white/[0.1] ring-1 ring-[#7c83da]/40"
                : "hover:bg-white/[0.06]"
            }`}
            title="Your studio profile"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7c83da] to-[#4e536f] text-[10px] font-semibold text-white shadow-sm transition-transform group-hover:scale-105">
              {userProfile.avatarInitials || "YS"}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[11px] font-medium text-[#cac9c4] group-hover:text-white">
                {userProfile.displayName || "Your studio"}
              </span>
              <span className="block text-[9px] text-[#62635f]">
                Cloudflare AI Active
              </span>
            </span>
            <Icon
              name="more"
              size={16}
              className="text-[#62635f] group-hover:text-[#aeb3ef]"
            />
          </button>
        )}
      </div>
    </aside>
  );
}
