"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { answerOnboardingQuestion, createProject } from "@/lib/onboarding";
import { buildIllustrationPrompt } from "@/lib/illustration-prompt";
import {
  addVisualReference,
  canOpenPageCreation,
  createPageChatMessage,
  getAdjacentPageBeatId,
  normalizePageCreationState,
  removeVisualReference,
  resetEditedPrompt,
  saveEditedPrompt,
} from "@/lib/page-creation";
import {
  EMPTY_STUDIO_STATE,
  parseStudioSnapshot,
  type PersistedStudioState,
  type StudioView,
} from "@/lib/project-storage";
import {
  addPageBeat as addBeat,
  approveStoryPlan as approvePlan,
  createPlanningMessage,
  deletePageBeat as deleteBeat,
  generateStoryPlan as generatePlan,
  movePageBeat as moveBeat,
  updatePageBeat as updateBeat,
} from "@/lib/story-planner";
import type {
  PageBeat,
  PageCreativeSettings,
  ImageVersion,
  Project,
  VisualReferenceMetadata,
  VisualStyleBible,
} from "@/types/domain";

export type { StudioView } from "@/lib/project-storage";

const STORAGE_KEY = "vizzy:studio-state";
const STORE_EVENT = "vizzy:studio-state-change";
const EMPTY_SNAPSHOT = JSON.stringify(EMPTY_STUDIO_STATE);

function subscribe(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORE_EVENT, listener);
  };
}

function getClientSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function getServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

function writeState(state: PersistedStudioState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(STORE_EVENT));
  } catch {
    // localStorage is the prototype persistence layer; unavailable storage leaves the UI unchanged.
  }
}

function replaceProject(state: PersistedStudioState, project: Project): PersistedStudioState {
  return {
    ...state,
    projects: state.projects.map((candidate) =>
      candidate.id === project.id ? project : candidate,
    ),
  };
}

function appendReapprovalMessage(project: Project, wasApproved: boolean) {
  if (!wasApproved) return project.planningChatHistory;
  return [
    ...project.planningChatHistory,
    createPlanningMessage(
      "The approved sequence changed, so I’ve returned the plan to draft. Review the update and approve it again when ready.",
    ),
  ];
}

function updateProjectPageCreation(
  project: Project,
  pageBeatId: string,
  updater: (creation: PageBeat["creation"]) => PageBeat["creation"],
) {
  if (!project.storyPlan) return project;

  return {
    ...project,
    updatedAt: new Date().toISOString(),
    storyPlan: {
      ...project.storyPlan,
      pageBeats: project.storyPlan.pageBeats.map((page) => {
        if (page.id !== pageBeatId) return page;
        const creation = updater(normalizePageCreationState(page.creation));
        const preparedPage = { ...page, creation };
        const automaticPrompt = buildIllustrationPrompt(project, preparedPage);
        return {
          ...preparedPage,
          creation: {
            ...creation,
            illustrationStatus: "prompt_ready" as const,
            prompt: {
              ...creation.prompt,
              automaticPrompt,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      }),
    },
  };
}

function updateProjectPageImages(
  project: Project,
  pageBeatId: string,
  updater: (creation: PageBeat["creation"]) => PageBeat["creation"],
) {
  if (!project.storyPlan) return project;
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    storyPlan: {
      ...project.storyPlan,
      pageBeats: project.storyPlan.pageBeats.map((page) =>
        page.id === pageBeatId
          ? { ...page, creation: updater(normalizePageCreationState(page.creation)) }
          : page,
      ),
    },
  };
}

function preparePageCreation(project: Project, pageBeatId: string) {
  return updateProjectPageCreation(project, pageBeatId, (creation) => ({
    ...creation,
    chatHistory: creation.chatHistory.length
      ? creation.chatHistory
      : [
          createPageChatMessage(
            "assistant",
            "This approved page is ready for visual development. Adjust its settings, refine the prepared prompt, add reference metadata, or leave page-specific notes here.",
          ),
        ],
  }));
}

function refreshProjectPrompts(project: Project) {
  return project.storyPlan?.pageBeats.reduce(
    (current, page) => updateProjectPageCreation(current, page.id, (creation) => creation),
    project,
  ) ?? project;
}

export function useProjectStore() {
  const snapshot = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const state = useMemo(() => parseStudioSnapshot(snapshot), [snapshot]);
  const selectedProject =
    state.projects.find((project) => project.id === state.selectedProjectId) ?? null;

  const updateState = useCallback(
    (updater: (current: PersistedStudioState) => PersistedStudioState) => {
      writeState(updater(parseStudioSnapshot(getClientSnapshot())));
    },
    [],
  );

  const addProject = useCallback(
    (initialProject?: Project) => {
      const project = initialProject ?? createProject();
      updateState((current) => {
        const withoutDuplicate = current.projects.filter((p) => p.id !== project.id);
        const projects = [...withoutDuplicate, project];

        return {
          ...current,
          version: 3,
          projects,
          selectedProjectId: project.id,
          activeView: initialProject ? "slideshow" : "story",
        };
      });
    },
    [updateState],
  );

  const selectProject = useCallback(
    (projectId: string) => {
      updateState((current) => ({
        ...current,
        selectedProjectId: projectId,
        activeView: "story",
      }));
    },
    [updateState],
  );

  const setActiveView = useCallback(
    (activeView: StudioView) => {
      updateState((current) => {
        if (activeView !== "planning" || !current.selectedProjectId) {
          return { ...current, activeView };
        }

        return {
          ...current,
          activeView,
          projects: current.projects.map((project) => {
            if (project.id !== current.selectedProjectId || project.planningChatHistory.length) {
              return project;
            }
            return {
              ...project,
              planningChatHistory: [
                createPlanningMessage(
                  "Let’s turn your saved story concept into an editable page sequence. Choose a page count in the planning workspace, then I’ll prepare a clearly labelled suggested draft.",
                ),
              ],
            };
          }),
        };
      });
    },
    [updateState],
  );

  const submitOnboardingAnswer = useCallback(
    (answer: string) => {
      if (!state.selectedProjectId) return;

      updateState((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === current.selectedProjectId
            ? answerOnboardingQuestion(project, answer)
            : project,
        ),
      }));
    },
    [state.selectedProjectId, updateState],
  );

  const updateStyleBible = useCallback(
    (updates: Partial<Omit<VisualStyleBible, "projectId">>) => {
      updateState((current) => ({
        ...current,
        projects: current.projects.map((project) => {
          if (project.id !== current.selectedProjectId) return project;

          const characterDescriptions = updates.characterDescriptions;
          const nextProject: Project = {
            ...project,
            updatedAt: new Date().toISOString(),
            styleBible: { ...project.styleBible, ...updates },
            characters:
              characterDescriptions === undefined
                ? project.characters
                : characterDescriptions
                  ? [
                      {
                        id: project.characters[0]?.id ?? `character-${project.id}`,
                        projectId: project.id,
                        name: project.characters[0]?.name ?? "Main character notes",
                        description: characterDescriptions,
                      },
                    ]
                  : [],
          };
          return refreshProjectPrompts(nextProject);
        }),
      }));
    },
    [updateState],
  );

  const generateStoryPlan = useCallback(
    (pageCount: number) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        if (!project || project.onboarding.status !== "complete") return current;

        const storyPlan = generatePlan(project, pageCount);
        return replaceProject(current, {
          ...project,
          storyPlan,
          selectedPageBeatId: storyPlan.pageBeats[0]?.id ?? null,
          planningChatHistory: [
            ...project.planningChatHistory,
            createPlanningMessage(
              `I created a suggested ${pageCount}-page draft from your saved concept and creative direction. Every beat is editable, and no image generation has occurred.`,
            ),
          ],
        });
      });
    },
    [updateState],
  );

  const selectPageBeat = useCallback(
    (pageBeatId: string) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        return project
          ? replaceProject(current, { ...project, selectedPageBeatId: pageBeatId })
          : current;
      });
    },
    [updateState],
  );

  const openPageCreation = useCallback(
    (pageBeatId: string) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        if (!project?.storyPlan || !canOpenPageCreation(project.storyPlan, pageBeatId)) {
          return current;
        }

        const preparedProject = preparePageCreation(project, pageBeatId);
        return {
          ...replaceProject(current, {
            ...preparedProject,
            selectedPageBeatId: pageBeatId,
          }),
          activeView: "page_creation",
        };
      });
    },
    [updateState],
  );

  const navigatePageCreation = useCallback(
    (direction: "previous" | "next") => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        if (!project?.storyPlan || !project.selectedPageBeatId) return current;
        const nextPageId = getAdjacentPageBeatId(
          project.storyPlan,
          project.selectedPageBeatId,
          direction,
        );
        if (!nextPageId) return current;
        const nextProject = preparePageCreation(project, nextPageId);
        return {
          ...replaceProject(current, { ...nextProject, selectedPageBeatId: nextPageId }),
          activeView: "page_creation",
        };
      });
    },
    [updateState],
  );

  const updatePageCreativeSettings = useCallback(
    (pageBeatId: string, updates: Partial<PageCreativeSettings>) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        if (!project) return current;
        return replaceProject(
          current,
          updateProjectPageCreation(project, pageBeatId, (creation) => ({
            ...creation,
            revision: (creation.revision ?? 1) + 1,
            settings: { ...creation.settings, ...updates },
          })),
        );
      });
    },
    [updateState],
  );

  const savePagePrompt = useCallback(
    (pageBeatId: string, prompt: string) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        return project
          ? replaceProject(
              current,
              updateProjectPageCreation(project, pageBeatId, (creation) =>
                saveEditedPrompt(creation, prompt),
              ),
            )
          : current;
      });
    },
    [updateState],
  );

  const resetPagePrompt = useCallback(
    (pageBeatId: string) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        return project
          ? replaceProject(
              current,
              updateProjectPageCreation(project, pageBeatId, resetEditedPrompt),
            )
          : current;
      });
    },
    [updateState],
  );

  const savePageImages = useCallback(
    (pageBeatId: string, versions: ImageVersion[]) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        if (!project?.storyPlan) return current;

        const targetPage = project.storyPlan.pageBeats.find((p) => p.id === pageBeatId);
        if (!targetPage) return current;

        // Idempotency: Deduplicate versions so duplicate completions never duplicate entries
        const existingVersions = targetPage.creation.imageVersions;
        const existingIds = new Set(existingVersions.map((v) => v.id));
        const newUniqueVersions = versions.filter((v) => !existingIds.has(v.id));

        if (newUniqueVersions.length === 0) return current;

        // Approval safety: If page or existing artwork is approved, keep approved artwork selected
        const isApproved =
          targetPage.status === "approved" ||
          existingVersions.some((v) => v.status === "approved");
        const versionsToAppend = isApproved
          ? newUniqueVersions.map((v) => ({ ...v, selected: false, status: "generated" as const }))
          : newUniqueVersions;

        const combinedVersions = [...existingVersions, ...versionsToAppend];

        return replaceProject(
          current,
          updateProjectPageImages(project, pageBeatId, (creation) => ({
            ...creation,
            illustrationStatus: isApproved ? "approved" : "options_ready",
            imageVersions: combinedVersions,
          })),
        );
      });
    },
    [updateState],
  );

  const selectPageImage = useCallback(
    (pageBeatId: string, versionId: string) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        return project
          ? replaceProject(
              current,
              updateProjectPageImages(project, pageBeatId, (creation) => ({
                ...creation,
                illustrationStatus: "options_ready",
                imageVersions: creation.imageVersions.map((version) => {
                  const selected = version.id === versionId;
                  return {
                    ...version,
                    selected,
                    status: selected ? "selected" : "generated",
                  };
                }),
              })),
            )
          : current;
      });
    },
    [updateState],
  );

  const addPageReference = useCallback(
    (
      pageBeatId: string,
      reference: Pick<VisualReferenceMetadata, "title" | "url" | "description" | "purpose">,
    ) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        return project
          ? replaceProject(
              current,
              updateProjectPageCreation(project, pageBeatId, (creation) =>
                addVisualReference(creation, pageBeatId, reference),
              ),
            )
          : current;
      });
    },
    [updateState],
  );

  const removePageReference = useCallback(
    (pageBeatId: string, referenceId: string) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        return project
          ? replaceProject(
              current,
              updateProjectPageCreation(project, pageBeatId, (creation) =>
                removeVisualReference(creation, referenceId),
              ),
            )
          : current;
      });
    },
    [updateState],
  );

  const addPageInstruction = useCallback(
    (pageBeatId: string, instruction: string) => {
      const note = instruction.trim();
      if (!note) return;
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        if (!project) return current;
        return replaceProject(
          current,
          updateProjectPageCreation(project, pageBeatId, (creation) => ({
            ...creation,
            settings: {
              ...creation.settings,
              additionalInstructions: [creation.settings.additionalInstructions, note]
                .filter(Boolean)
                .join("\n"),
            },
            chatHistory: [
              ...creation.chatHistory,
              createPageChatMessage("user", note),
              createPageChatMessage(
                "assistant",
                "Saved verbatim as an additional instruction for this page. The prepared automatic prompt now includes it.",
              ),
            ],
          })),
        );
      });
    },
    [updateState],
  );

  const updatePageBeat = useCallback(
    (
      pageBeatId: string,
      updates: Partial<
        Pick<
          PageBeat,
          "title" | "description" | "visualDirection" | "narration" | "dialogue" | "optionalActLabel"
        >
      >,
    ) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        if (!project?.storyPlan) return current;
        const wasApproved = project.storyPlan.status === "approved";
        return replaceProject(current, {
          ...project,
          storyPlan: updateBeat(project.storyPlan, pageBeatId, updates),
          planningChatHistory: appendReapprovalMessage(project, wasApproved),
        });
      });
    },
    [updateState],
  );

  const addPageBeat = useCallback(() => {
    updateState((current) => {
      const project = current.projects.find(
        (candidate) => candidate.id === current.selectedProjectId,
      );
      if (!project?.storyPlan) return current;
      const wasApproved = project.storyPlan.status === "approved";
      const storyPlan = addBeat(project.storyPlan, project.selectedPageBeatId);
      if (storyPlan === project.storyPlan) return current;
      const addedPage = storyPlan.pageBeats.find(
        (page) => !project.storyPlan?.pageBeats.some((existing) => existing.id === page.id),
      );

      return replaceProject(current, {
        ...project,
        storyPlan,
        selectedPageBeatId: addedPage?.id ?? project.selectedPageBeatId,
        planningChatHistory: [
          ...appendReapprovalMessage(project, wasApproved),
          createPlanningMessage(`Added Page ${addedPage?.order ?? storyPlan.pageBeats.length} to the draft.`),
        ],
      });
    });
  }, [updateState]);

  const deletePageBeat = useCallback(
    (pageBeatId: string) => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        if (!project?.storyPlan) return current;
        const wasApproved = project.storyPlan.status === "approved";
        const deletedIndex = project.storyPlan.pageBeats.findIndex((page) => page.id === pageBeatId);
        const storyPlan = deleteBeat(project.storyPlan, pageBeatId);
        const nextSelection =
          storyPlan.pageBeats[Math.min(Math.max(deletedIndex, 0), storyPlan.pageBeats.length - 1)]?.id ??
          null;

        return replaceProject(current, {
          ...project,
          storyPlan,
          selectedPageBeatId:
            project.selectedPageBeatId === pageBeatId
              ? nextSelection
              : project.selectedPageBeatId,
          planningChatHistory: appendReapprovalMessage(project, wasApproved),
        });
      });
    },
    [updateState],
  );

  const movePageBeat = useCallback(
    (pageBeatId: string, direction: "up" | "down") => {
      updateState((current) => {
        const project = current.projects.find(
          (candidate) => candidate.id === current.selectedProjectId,
        );
        if (!project?.storyPlan) return current;
        const wasApproved = project.storyPlan.status === "approved";
        const storyPlan = moveBeat(project.storyPlan, pageBeatId, direction);
        if (storyPlan === project.storyPlan) return current;

        return replaceProject(current, {
          ...project,
          storyPlan,
          planningChatHistory: appendReapprovalMessage(project, wasApproved),
        });
      });
    },
    [updateState],
  );

  const approveStoryPlan = useCallback(() => {
    updateState((current) => {
      const project = current.projects.find(
        (candidate) => candidate.id === current.selectedProjectId,
      );
      if (!project?.storyPlan?.pageBeats.length) return current;
      const storyPlan = approvePlan(project.storyPlan);
      return replaceProject(current, {
        ...project,
        storyPlan,
        selectedPageBeatId: project.selectedPageBeatId ?? storyPlan.pageBeats[0]?.id ?? null,
        planningChatHistory: [
          ...project.planningChatHistory,
          createPlanningMessage(
            `Story plan approved. All ${storyPlan.pageBeats.length} pages are now available in the Pages workspace for prompt preparation and visual development.`,
          ),
        ],
      });
    });
  }, [updateState]);

  return {
    projects: state.projects,
    selectedProject,
    activeView: state.activeView,
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
  };
}
