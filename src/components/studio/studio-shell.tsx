"use client";

import { useState, useEffect, useSyncExternalStore, useCallback } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { WorkspaceCanvas } from "@/components/storyboard/workspace-canvas";
import { SettingsModal } from "@/components/studio/settings-modal";
import { StudioProfileModal } from "@/components/studio/studio-profile-modal";
import { Icon } from "@/components/ui/icon";
import { LogoMark } from "@/components/ui/logo-mark";
import { useProjectStore } from "@/hooks/use-project-store";
import {
  applyCanvasBackground,
  getCanvasBackgroundSnapshot,
  subscribeCanvasBackground,
} from "@/lib/profile-storage";

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("vizzy:theme-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("vizzy:theme-change", callback);
  };
}

function getThemeSnapshot(): "dark" | "light" | "system" {
  try {
    return (localStorage.getItem("vizzy_theme") as "dark" | "light" | "system") || "dark";
  } catch {
    return "dark";
  }
}

function getThemeServerSnapshot(): "dark" | "light" | "system" {
  return "dark";
}

function subscribeSidebar(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("vizzy:sidebar-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("vizzy:sidebar-change", callback);
  };
}

function getSidebarSnapshot(): boolean {
  try {
    return localStorage.getItem("vizzy_sidebar_collapsed") === "true";
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot(): boolean {
  return false;
}

function subscribeRightPanel(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("vizzy:right-panel-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("vizzy:right-panel-change", callback);
  };
}

function getRightPanelSnapshot(): boolean {
  try {
    return localStorage.getItem("vizzy_right_panel_collapsed") === "true";
  } catch {
    return false;
  }
}

function getRightPanelServerSnapshot(): boolean {
  return false;
}

function getGridColsClass(leftCollapsed: boolean, rightCollapsed: boolean) {
  if (leftCollapsed && rightCollapsed) {
    return "grid-cols-[60px_minmax(480px,1fr)_0px] max-[960px]:grid-cols-[60px_minmax(410px,1fr)_0px]";
  }
  if (leftCollapsed && !rightCollapsed) {
    return "grid-cols-[60px_minmax(480px,1fr)_390px] max-[1180px]:grid-cols-[60px_minmax(430px,1fr)_350px] max-[960px]:grid-cols-[60px_minmax(410px,1fr)_340px]";
  }
  if (!leftCollapsed && rightCollapsed) {
    return "grid-cols-[240px_minmax(480px,1fr)_0px] max-[1180px]:grid-cols-[210px_minmax(430px,1fr)_0px] max-[960px]:grid-cols-[76px_minmax(410px,1fr)_0px]";
  }
  return "grid-cols-[240px_minmax(480px,1fr)_390px] max-[1180px]:grid-cols-[210px_minmax(430px,1fr)_350px] max-[960px]:grid-cols-[76px_minmax(410px,1fr)_340px]";
}

export function StudioShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [studioProfileOpen, setStudioProfileOpen] = useState(false);

  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const canvasBg = useSyncExternalStore(
    subscribeCanvasBackground,
    getCanvasBackgroundSnapshot,
    () => "warm_paper" as const,
  );
  const sidebarCollapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot,
  );

  const toggleSidebar = useCallback(() => {
    try {
      const next = !getSidebarSnapshot();
      localStorage.setItem("vizzy_sidebar_collapsed", String(next));
      window.dispatchEvent(new Event("vizzy:sidebar-change"));
    } catch {
      // ignore
    }
  }, []);

  const rightPanelCollapsed = useSyncExternalStore(
    subscribeRightPanel,
    getRightPanelSnapshot,
    getRightPanelServerSnapshot,
  );

  const toggleRightPanel = useCallback(() => {
    try {
      const next = !getRightPanelSnapshot();
      localStorage.setItem("vizzy_right_panel_collapsed", String(next));
      window.dispatchEvent(new Event("vizzy:right-panel-change"));
    } catch {
      // ignore
    }
  }, []);

  const setTheme = useCallback((newTheme: "dark" | "light" | "system") => {
    try {
      localStorage.setItem("vizzy_theme", newTheme);
      window.dispatchEvent(new Event("vizzy:theme-change"));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (theme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
      } else {
        document.documentElement.setAttribute("data-theme", theme);
      }
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      applyCanvasBackground(canvasBg);
    } catch {
      // ignore
    }
  }, [canvasBg]);
  const {
    projects,
    selectedProject,
    activeView,
    addProject,
    selectProject,
    setActiveView,
    submitOnboardingAnswer,
    updateStyleBible,
    generateStoryPlan,
    selectPageBeat,
    openPageCreation,
    navigatePageCreation,
    updatePageCreativeSettings,
    savePagePrompt,
    resetPagePrompt,
    savePageImages,
    selectPageImage,
    addPageReference,
    removePageReference,
    addPageInstruction,
    updatePageBeat,
    addPageBeat,
    deletePageBeat,
    movePageBeat,
    approveStoryPlan,
  } = useProjectStore();

  return (
    <main
      suppressHydrationWarning
      className={`grid min-h-dvh overflow-hidden transition-[grid-template-columns] duration-200 ease-in-out ${getGridColsClass(
        sidebarCollapsed,
        rightPanelCollapsed,
      )} ${
        theme === "light" ? "bg-[#e8e4dc] text-[#1a1b18]" : "bg-[#111210] text-[#f5f3ef]"
      } max-[760px]:block max-[760px]:overflow-auto`}
    >
      <div className="sticky top-0 z-50 hidden h-14 items-center gap-2 border-b border-white/[0.06] bg-[#151614]/95 px-3 backdrop-blur-md max-[760px]:flex">
        <LogoMark size={28} />
        <select
          aria-label="Current project"
          value={selectedProject?.id ?? ""}
          onChange={(event) => selectProject(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 py-2 text-[10px] text-[#deddd8] outline-none"
        >
          {projects.length === 0 && <option value="">No projects</option>}
          {projects.map((project, index) => (
            <option key={`${project.id}-${index}`} value={project.id} className="bg-[#1b1c1a]">
              {project.title}
            </option>
          ))}
        </select>
        {selectedProject && (
          <>
            <button
              type="button"
              onClick={() => setActiveView("story")}
              className={`grid h-9 w-9 place-items-center rounded-lg ${activeView === "story" ? "bg-white/[0.1] text-white" : "text-[#7f807a]"}`}
              aria-label="Story view"
            >
              <Icon name="story" size={17} />
            </button>
            <button
              type="button"
              onClick={() => setActiveView("style_bible")}
              className={`grid h-9 w-9 place-items-center rounded-lg ${activeView === "style_bible" ? "bg-white/[0.1] text-white" : "text-[#7f807a]"}`}
              aria-label="Style Bible view"
            >
              <Icon name="palette" size={17} />
            </button>
            {selectedProject.onboarding.status === "complete" && (
              <button
                type="button"
                onClick={() =>
                  setActiveView(
                    selectedProject.storyPlan?.status === "approved" ? "pages" : "planning",
                  )
                }
                className={`grid h-9 w-9 place-items-center rounded-lg ${["planning", "pages", "page_creation"].includes(activeView) ? "bg-white/[0.1] text-white" : "text-[#7f807a]"}`}
                aria-label={
                  selectedProject.storyPlan?.status === "approved"
                    ? "Approved pages"
                    : "Story planning"
                }
              >
                <Icon name="pages" size={17} />
              </button>
            )}
          </>
        )}
        <button
          type="button"
          onClick={() => setActiveView("profile")}
          className={`grid h-9 w-9 place-items-center rounded-lg ${activeView === "profile" ? "bg-white/[0.1] text-white" : "text-[#7f807a] hover:text-white"}`}
          aria-label="Creator profile"
        >
          <Icon name="characters" size={17} />
        </button>
        <button
          type="button"
          onClick={() => setActiveView("settings")}
          className={`grid h-9 w-9 place-items-center rounded-lg ${activeView === "settings" ? "bg-white/[0.1] text-white" : "text-[#7f807a] hover:text-white"}`}
          aria-label="Studio settings"
        >
          <Icon name="settings" size={17} />
        </button>
        <button
          type="button"
          onClick={() => addProject()}
          className="grid h-9 w-9 place-items-center rounded-lg bg-[#777fd7] text-white"
          aria-label="New project"
        >
          <Icon name="plus" size={17} />
        </button>
      </div>

      <AppSidebar
        projects={projects}
        selectedProject={selectedProject}
        activeView={activeView}
        onCreateProject={addProject}
        onSelectProject={selectProject}
        onSelectView={setActiveView}
        onOpenSettings={() => setActiveView("settings")}
        onOpenStudioProfile={() => setActiveView("profile")}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <WorkspaceCanvas
        project={selectedProject}
        projects={projects}
        activeView={activeView}
        rightPanelCollapsed={rightPanelCollapsed}
        onToggleRightPanel={toggleRightPanel}
        onCreateProject={addProject}
        onSelectView={setActiveView}
        onUpdateStyleBible={updateStyleBible}
        onGenerateStoryPlan={generateStoryPlan}
        onSelectPage={selectPageBeat}
        onOpenPageCreation={openPageCreation}
        onNavigatePageCreation={navigatePageCreation}
        onUpdatePageCreativeSettings={updatePageCreativeSettings}
        onSavePagePrompt={savePagePrompt}
        onResetPagePrompt={resetPagePrompt}
        onSavePageImages={savePageImages}
        onSelectPageImage={selectPageImage}
        onAddPageReference={addPageReference}
        onRemovePageReference={removePageReference}
        onUpdatePage={updatePageBeat}
        onAddPage={addPageBeat}
        onDeletePage={deletePageBeat}
        onMovePage={movePageBeat}
        onApproveStoryPlan={approveStoryPlan}
      />
      <ChatPanel
        project={selectedProject}
        activeView={activeView}
        collapsed={rightPanelCollapsed}
        onToggleCollapse={toggleRightPanel}
        onCreateProject={addProject}
        onSubmitAnswer={submitOnboardingAnswer}
        onSelectView={setActiveView}
        onGenerateStoryPlan={generateStoryPlan}
        onAddPage={addPageBeat}
        onApproveStoryPlan={approveStoryPlan}
        onAddPageInstruction={addPageInstruction}
        onSelectPageBeat={selectPageBeat}
        onOpenPageCreation={openPageCreation}
        onSavePageImages={savePageImages}
        onSelectPageImage={selectPageImage}
        onUpdatePageCreativeSettings={updatePageCreativeSettings}
        onUpdatePage={updatePageBeat}
      />
      <SettingsModal
        isOpen={settingsOpen}
        theme={theme}
        onThemeChange={(newTheme) => setTheme(newTheme)}
        onClose={() => setSettingsOpen(false)}
        onResetProject={() => {
          localStorage.removeItem("vizzy:studio-state");
          localStorage.removeItem("vizzy_demo_mode");
          window.location.reload();
        }}
      />
      <StudioProfileModal
        isOpen={studioProfileOpen}
        projects={projects}
        selectedProject={selectedProject}
        onClose={() => setStudioProfileOpen(false)}
        onSelectProject={selectProject}
        onCreateProject={addProject}
      />
    </main>
  );
}
