import type { Project } from "@/types/domain";
import { normalizePageCreationState } from "@/lib/page-creation";

export type StudioView =
  | "story"
  | "style_bible"
  | "characters"
  | "pages"
  | "planning"
  | "page_creation"
  | "slideshow"
  | "profile"
  | "settings";

export interface PersistedStudioState {
  version: 3;
  projects: Project[];
  selectedProjectId: string | null;
  activeView: StudioView;
}

export const EMPTY_STUDIO_STATE: PersistedStudioState = {
  version: 3,
  projects: [],
  selectedProjectId: null,
  activeView: "story",
};

const VALID_VIEWS = new Set<StudioView>([
  "story",
  "style_bible",
  "characters",
  "pages",
  "planning",
  "page_creation",
  "slideshow",
  "profile",
  "settings",
]);

function migrateProject(project: Project): Project {
  const storyPlan = project.storyPlan
    ? {
        ...project.storyPlan,
        pageBeats: project.storyPlan.pageBeats.map((page) => ({
          ...page,
          creation: normalizePageCreationState(page.creation),
        })),
      }
    : null;

  return {
    ...project,
    storyPlan,
    selectedPageBeatId: project.selectedPageBeatId ?? null,
    planningChatHistory: Array.isArray(project.planningChatHistory)
      ? project.planningChatHistory
      : [],
  };
}

export function migrateStudioState(value: unknown): PersistedStudioState {
  if (!value || typeof value !== "object") return EMPTY_STUDIO_STATE;

  const candidate = value as {
    version?: number;
    projects?: Project[];
    selectedProjectId?: unknown;
    activeView?: unknown;
  };
  if (![1, 2, 3].includes(candidate.version ?? -1) || !Array.isArray(candidate.projects)) {
    return EMPTY_STUDIO_STATE;
  }

  // Deduplicate projects by ID so legacy snapshots or duplicate additions never crash React
  const seenIds = new Set<string>();
  const uniqueProjects: Project[] = [];
  for (const rawProject of candidate.projects) {
    if (rawProject && typeof rawProject === "object" && "id" in rawProject && rawProject.id) {
      if (!seenIds.has(rawProject.id)) {
        seenIds.add(rawProject.id);
        uniqueProjects.push(migrateProject(rawProject));
      }
    }
  }

  return {
    version: 3,
    projects: uniqueProjects,
    selectedProjectId:
      typeof candidate.selectedProjectId === "string" ? candidate.selectedProjectId : null,
    activeView:
      typeof candidate.activeView === "string" && VALID_VIEWS.has(candidate.activeView as StudioView)
        ? (candidate.activeView as StudioView)
        : "story",
  };
}

export function parseStudioSnapshot(snapshot: string): PersistedStudioState {
  try {
    return migrateStudioState(JSON.parse(snapshot));
  } catch {
    return EMPTY_STUDIO_STATE;
  }
}
