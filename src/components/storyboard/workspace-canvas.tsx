import { useEffect, useRef } from "react";
import { PagesWorkspace } from "@/components/storyboard/pages-workspace";
import { PageCreationWorkspace } from "@/components/storyboard/page-creation-workspace";
import { StoryPlanningPanel } from "@/components/storyboard/story-planning-panel";
import { StyleBiblePanel } from "@/components/storyboard/style-bible-panel";
import { SlideshowWorkspace } from "@/components/storyboard/slideshow-workspace";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { ProfileWorkspace } from "@/components/profile/profile-workspace";
import { Icon } from "@/components/ui/icon";
import type { StudioView } from "@/hooks/use-project-store";
import { getOutputTypeLabel, ONBOARDING_STEP_ORDER } from "@/lib/onboarding";
import type {
  PageBeat,
  PageCreativeSettings,
  ImageVersion,
  Project,
  VisualReferenceMetadata,
  VisualStyleBible,
} from "@/types/domain";

interface WorkspaceCanvasProps {
  project: Project | null;
  projects?: Project[];
  activeView: StudioView;
  onCreateProject: () => void;
  onSelectView: (view: StudioView) => void;
  onUpdateStyleBible: (updates: Partial<Omit<VisualStyleBible, "projectId">>) => void;
  onGenerateStoryPlan: (pageCount: number) => void;
  onSelectPage: (pageBeatId: string) => void;
  onOpenPageCreation: (pageBeatId: string) => void;
  onNavigatePageCreation: (direction: "previous" | "next") => void;
  onUpdatePageCreativeSettings: (
    pageBeatId: string,
    updates: Partial<PageCreativeSettings>,
  ) => void;
  onSavePagePrompt: (pageBeatId: string, prompt: string) => void;
  onResetPagePrompt: (pageBeatId: string) => void;
  onSavePageImages: (pageBeatId: string, versions: ImageVersion[]) => void;
  onSelectPageImage: (pageBeatId: string, versionId: string) => void;
  onAddPageReference: (
    pageBeatId: string,
    reference: Pick<VisualReferenceMetadata, "title" | "url" | "description" | "purpose">,
  ) => void;
  onRemovePageReference: (pageBeatId: string, referenceId: string) => void;
  onUpdatePage: (
    pageBeatId: string,
    updates: Partial<
      Pick<
        PageBeat,
        "title" | "description" | "visualDirection" | "narration" | "dialogue" | "optionalActLabel"
      >
    >,
  ) => void;
  onAddPage: () => void;
  onDeletePage: (pageBeatId: string) => void;
  onMovePage: (pageBeatId: string, direction: "up" | "down") => void;
  onApproveStoryPlan: () => void;
  rightPanelCollapsed?: boolean;
  onToggleRightPanel?: () => void;
}

import { createDDaySampleProject } from "@/lib/sample-story";

function EmptyWorkspace({ onCreateProject }: { onCreateProject: (custom?: Project) => void }) {
  return (
    <div className="relative z-10 w-full min-w-0 max-w-[420px] rounded-2xl border border-white/65 bg-[#fbf8f2]/90 px-7 py-8 text-center shadow-[0_18px_50px_rgba(75,67,58,.13)] backdrop-blur-md sm:px-9">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#282927] text-[#f6f1e8] shadow-lg">
        <Icon name="sparkles" size={20} />
      </div>
      <h2 className="mt-5 font-serif text-[26px] tracking-[-0.035em] text-[#292a27]">
        Your story starts here.
      </h2>
      <p className="mt-3 text-[11px] leading-[1.65] text-[#777269]">
        Create a project and Vizzy will help shape its story, format, characters, and visual direction.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={() => onCreateProject()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#282927] px-4 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#3b3c39]"
        >
          <Icon name="plus" size={15} />
          Create new project
        </button>
        <button
          type="button"
          onClick={() => onCreateProject(createDDaySampleProject())}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#777fd7]/40 bg-[#777fd7]/15 px-4 py-2.5 text-[11px] font-semibold text-[#484ea0] transition-colors hover:bg-[#777fd7]/25"
        >
          <Icon name="sparkles" size={15} />
          ⚡ Load D-Day Demo
        </button>
      </div>
    </div>
  );
}

function ProjectSummary({ project, onSelectView }: { project: Project; onSelectView: (view: StudioView) => void }) {
  const styleItems = [
    project.styleBible.artStyle,
    project.styleBible.mood,
    project.styleBible.palette,
  ].filter(Boolean);
  const directionNotes = [
    { label: "Art style", value: project.styleBible.artStyle },
    { label: "Mood", value: project.styleBible.mood },
    { label: "Palette", value: project.styleBible.palette },
    { label: "Characters", value: project.styleBible.characterDescriptions },
    { label: "References", value: project.styleBible.visualReferences },
    { label: "Instructions", value: project.styleBible.additionalInstructions },
  ].filter((item) => item.value);

  return (
    <div className="relative z-10 w-full max-w-[470px] rounded-2xl border border-white/70 bg-[#fbf8f2]/95 px-7 py-7 shadow-[0_22px_60px_rgba(75,67,58,.15)] backdrop-blur-md">
      <div className="flex items-center gap-2 text-[#657053]">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#dce6d4] text-[13px]">✓</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.16em]">Creative direction ready</span>
      </div>
      <h2 className="mt-4 font-serif text-[26px] tracking-[-0.035em] text-[#292a27]">{project.title}</h2>
      <p className="mt-3 line-clamp-4 text-[11px] leading-[1.7] text-[#6f6b63]">{project.description}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-[#696157]/10 py-4">
        <div>
          <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#969087]">Format</div>
          <div className="mt-1.5 text-[11px] font-semibold text-[#3d3d38]">
            {getOutputTypeLabel(project.outputType)}
          </div>
        </div>
        <div>
          <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#969087]">Style Bible</div>
          <div className="mt-1.5 text-[11px] font-semibold text-[#3d3d38]">
            {styleItems.length ? `${styleItems.length} details captured` : "Ready to refine"}
          </div>
        </div>
      </div>

      {styleItems.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {styleItems.slice(0, 4).map((item) => (
            <span key={item} className="max-w-full truncate rounded-full bg-[#e8e3da] px-2.5 py-1.5 text-[9px] text-[#67635c]">
              {item}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-xl bg-[#eae5dc]/75 p-4">
        <div className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#8b857c]">
          Style Bible
        </div>
        {directionNotes.length ? (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {directionNotes.map((item) => (
              <div key={item.label} className="min-w-0">
                <span className="text-[8px] font-semibold uppercase tracking-wide text-[#969087]">
                  {item.label}
                </span>
                <p className="mt-0.5 line-clamp-2 text-[9px] leading-relaxed text-[#5f5b54]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[9px] leading-relaxed text-[#777269]">
            No optional visual details were added yet. Open the Style Bible to shape them now.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelectView("style_bible")}
          className="rounded-xl border border-[#5e594f]/15 bg-white/45 px-3.5 py-2.5 text-[10px] font-semibold text-[#504d47] transition-colors hover:bg-white/75"
        >
          Edit creative direction
        </button>
        <button
          type="button"
          onClick={() => onSelectView("planning")}
          className="rounded-xl bg-[#282927] px-3.5 py-2.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#3b3c39]"
        >
          Continue to story planning
        </button>
      </div>
    </div>
  );
}

function OnboardingCanvas({ project }: { project: Project }) {
  const stepIndex = ONBOARDING_STEP_ORDER.indexOf(project.onboarding.currentStep);
  const progress = Math.round((stepIndex / (ONBOARDING_STEP_ORDER.length - 1)) * 100);

  return (
    <div className="relative z-10 w-full max-w-[430px] rounded-2xl border border-white/65 bg-[#fbf8f2]/92 px-8 py-8 text-center shadow-[0_18px_50px_rgba(75,67,58,.13)] backdrop-blur-md">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#282927] text-[#f6f1e8] shadow-lg">
        <Icon name="sparkles" size={19} />
      </div>
      <p className="mt-5 text-[8px] font-bold uppercase tracking-[0.17em] text-[#858077]">
        Creative onboarding · {progress}%
      </p>
      <h2 className="mt-2 font-serif text-[25px] tracking-[-0.035em] text-[#292a27]">
        Let’s shape {project.title === "Untitled Story" ? "your new world" : project.title}.
      </h2>
      <p className="mt-3 text-[11px] leading-[1.65] text-[#777269]">
        Continue the conversation with Vizzy. Your answers are building a reusable creative direction as you go.
      </p>
      <div className="mt-6 h-1 overflow-hidden rounded-full bg-[#ddd7ce]">
        <div className="h-full rounded-full bg-[#777fd7] transition-all" style={{ width: `${Math.max(progress, 4)}%` }} />
      </div>
    </div>
  );
}

function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative z-10 w-full min-w-0 max-w-[430px] rounded-2xl border border-white/65 bg-[#fbf8f2]/90 px-7 py-8 text-center shadow-[0_18px_50px_rgba(75,67,58,.13)] sm:px-9">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#e5dfd5] text-[#777269]">
        <Icon name="pages" size={18} />
      </div>
      <h2 className="mt-5 font-serif text-[25px] tracking-[-0.035em] text-[#292a27]">{title}</h2>
      <p className="mt-3 text-[11px] leading-[1.65] text-[#777269]">{description}</p>
    </div>
  );
}

export function WorkspaceCanvas({
  project,
  activeView,
  onCreateProject,
  onSelectView,
  onUpdateStyleBible,
  onGenerateStoryPlan,
  onSelectPage,
  onOpenPageCreation,
  onNavigatePageCreation,
  onUpdatePageCreativeSettings,
  onSavePagePrompt,
  onResetPagePrompt,
  onSavePageImages,
  onSelectPageImage,
  onAddPageReference,
  onRemovePageReference,
  onUpdatePage,
  onAddPage,
  onDeletePage,
  onMovePage,
  onApproveStoryPlan,
  projects = [],
  rightPanelCollapsed = false,
  onToggleRightPanel,
}: WorkspaceCanvasProps) {
  const title = project?.title ?? "Vizzy Studio";
  const selectedPage = project?.storyPlan?.pageBeats.find(
    (page) => page.id === project.selectedPageBeatId,
  );

  const previousViewRef = useRef<StudioView>("pages");
  useEffect(() => {
    if (activeView !== "slideshow") {
      previousViewRef.current = activeView;
    }
  }, [activeView]);

  return (
    <section
      className="relative flex h-dvh min-h-[650px] min-w-0 flex-col overflow-hidden max-[760px]:h-auto max-[760px]:min-h-[48rem]"
      style={{
        backgroundColor: "var(--canvas-bg)",
        color: "var(--canvas-ink)",
      }}
    >
      <header
        className="z-10 flex h-16 shrink-0 items-center justify-between border-b px-7"
        style={{ borderColor: "var(--canvas-header-border)" }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[13px] font-semibold tracking-[-0.01em]" style={{ color: "var(--canvas-ink)" }}>
              {activeView === "settings"
                ? "Studio Settings"
                : activeView === "profile"
                  ? "Creator Profile"
                  : title}
            </h1>
            {activeView !== "settings" && activeView !== "profile" && project && (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em]"
                style={{
                  backgroundColor: "var(--canvas-badge-bg)",
                  color: "var(--canvas-badge-text)",
                }}
              >
                {project.onboarding.status === "complete" ? "Ready" : "Draft"}
              </span>
            )}
          </div>
          <p className="mt-1 text-[10px]" style={{ color: "var(--canvas-muted)" }}>
            {activeView === "settings"
              ? "Appearance, creative presets, generation engines, and storage"
              : activeView === "profile"
                ? "Creator identity and storytelling format"
                : activeView === "style_bible"
                  ? "Visual Style Bible"
                  : activeView === "planning"
                    ? "Editorial planning board"
                    : activeView === "pages"
                      ? "Approved page sequence"
                      : activeView === "slideshow"
                        ? "Graphic novel slideshow & video loop"
                        : activeView === "page_creation"
                          ? selectedPage
                            ? `Page ${selectedPage.order} visual development`
                            : "Page visual development"
                          : project
                            ? getOutputTypeLabel(project.outputType)
                            : "Local creative workspace"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(activeView === "settings" || activeView === "profile") && (
            <button
              type="button"
              onClick={() =>
                onSelectView(
                  project
                    ? project.storyPlan?.status === "approved"
                      ? "pages"
                      : "planning"
                    : "story",
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[10px] font-semibold transition-colors hover:opacity-85"
              style={{
                backgroundColor: "var(--canvas-card-bg)",
                borderColor: "var(--canvas-card-border)",
                color: "var(--canvas-ink)",
              }}
            >
              <Icon name="chevron" size={13} className="rotate-180" />
              Back to Storyboard
            </button>
          )}
          {activeView !== "settings" && activeView !== "profile" && project && (
            <>
              {project.storyPlan && project.storyPlan.pageBeats.length > 0 && activeView !== "slideshow" && (
                <button
                  type="button"
                  onClick={() => onSelectView("slideshow")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#777fd7]/30 bg-[#777fd7]/15 px-3 py-2 text-[9px] font-semibold text-[#656cb7] hover:bg-[#777fd7]/25"
                >
                  <Icon name="slideshow" size={13} />
                  Play loop
                </button>
              )}
              {project.onboarding.status === "complete" && !["planning", "page_creation", "slideshow"].includes(activeView) && (
                <button
                  type="button"
                  onClick={() => onSelectView("planning")}
                  className="rounded-lg border px-3 py-2 text-[9px] font-semibold transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: "var(--canvas-card-bg)",
                    borderColor: "var(--canvas-card-border)",
                    color: "var(--canvas-muted)",
                  }}
                >
                  Story plan
                </button>
              )}
              {activeView !== "style_bible" && activeView !== "slideshow" && (
                <button
                  type="button"
                  onClick={() => onSelectView("style_bible")}
                  className="rounded-lg px-3.5 py-2 text-[10px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--canvas-order-bg)" }}
                >
                  Style Bible
                </button>
              )}
            </>
          )}
          {rightPanelCollapsed && onToggleRightPanel && (
            <button
              type="button"
              onClick={onToggleRightPanel}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[9px] font-semibold transition-colors hover:opacity-85 cursor-pointer ml-1"
              style={{
                backgroundColor: "var(--canvas-card-bg)",
                borderColor: "var(--canvas-card-border)",
                color: "var(--canvas-ink)",
              }}
              title="Open Creative Director (Chat)"
              aria-label="Open Creative Director panel"
            >
              <span className="hidden sm:inline">Creative Director</span>
              <Icon name="sidebar" size={14} className="rotate-180" />
            </button>
          )}
        </div>
      </header>

      <div className={`studio-scrollbar relative flex min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-7 max-[1180px]:p-6 ${["style_bible", "planning", "pages", "page_creation", "slideshow", "settings", "profile"].includes(activeView) ? "items-start" : "items-center justify-center"}`}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: "linear-gradient(var(--canvas-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--canvas-grid-color) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {activeView === "settings" ? (
          <SettingsWorkspace
            projects={projects}
            onBackToStudio={() =>
              onSelectView(
                project
                  ? project.storyPlan?.status === "approved"
                    ? "pages"
                    : "planning"
                  : "story",
              )
            }
          />
        ) : activeView === "profile" ? (
          <ProfileWorkspace
            onBackToStudio={() =>
              onSelectView(
                project
                  ? project.storyPlan?.status === "approved"
                    ? "pages"
                    : "planning"
                  : "story",
              )
            }
          />
        ) : !project ? (
          <EmptyWorkspace onCreateProject={onCreateProject} />
        ) : activeView === "style_bible" ? (
          <StyleBiblePanel project={project} onChange={onUpdateStyleBible} />
        ) : activeView === "planning" ? (
          <StoryPlanningPanel
            project={project}
            onGenerate={onGenerateStoryPlan}
            onSelectPage={onSelectPage}
            onUpdatePage={onUpdatePage}
            onAddPage={onAddPage}
            onDeletePage={onDeletePage}
            onMovePage={onMovePage}
            onApprove={onApproveStoryPlan}
            onViewPages={() => onSelectView("pages")}
            onEditDirection={() => onSelectView("style_bible")}
          />
        ) : activeView === "pages" ? (
          <PagesWorkspace
            project={project}
            onOpenPlanning={() => onSelectView("planning")}
            onSelectPage={(pageBeatId) => {
              onOpenPageCreation(pageBeatId);
            }}
          />
        ) : activeView === "slideshow" ? (
          <SlideshowWorkspace
            project={project}
            onBackToPages={() => onSelectView("pages")}
            onClose={() => {
              const target =
                previousViewRef.current && previousViewRef.current !== "slideshow"
                  ? previousViewRef.current
                  : project.storyPlan?.status === "approved"
                    ? "pages"
                    : "planning";
              onSelectView(target);
            }}
            onSelectPage={(pageBeatId) => {
              onOpenPageCreation(pageBeatId);
            }}
          />
        ) : activeView === "page_creation" && selectedPage ? (
          <PageCreationWorkspace
            project={project}
            page={selectedPage}
            onBack={() => onSelectView("pages")}
            onNavigate={onNavigatePageCreation}
            onUpdateSettings={(updates) =>
              onUpdatePageCreativeSettings(selectedPage.id, updates)
            }
            onSavePrompt={(prompt) => onSavePagePrompt(selectedPage.id, prompt)}
            onResetPrompt={() => onResetPagePrompt(selectedPage.id)}
            onSaveImages={(versions) => onSavePageImages(selectedPage.id, versions)}
            onSelectImage={(versionId) => onSelectPageImage(selectedPage.id, versionId)}
            onAddReference={(reference) => onAddPageReference(selectedPage.id, reference)}
            onRemoveReference={(referenceId) =>
              onRemovePageReference(selectedPage.id, referenceId)
            }
          />
        ) : activeView === "story" && project.onboarding.status === "complete" ? (
          <ProjectSummary project={project} onSelectView={onSelectView} />
        ) : activeView === "story" ? (
          <OnboardingCanvas project={project} />
        ) : activeView === "characters" ? (
          <PlaceholderView
            title={project.characters.length ? "Character direction captured" : "Characters are waiting"}
            description={project.styleBible.characterDescriptions || "Describe your main characters during onboarding, or add their visual notes in the Style Bible."}
          />
        ) : null}
      </div>
    </section>
  );
}
