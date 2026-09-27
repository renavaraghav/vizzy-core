import type {
  ChatMessage,
  PageCreationState,
  PageCreativeSettings,
  StoryPlan,
  VisualReferenceMetadata,
} from "@/types/domain";

function createId(prefix: string) {
  const uniquePart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${uniquePart}`;
}

export function createDefaultCreativeSettings(): PageCreativeSettings {
  return {
    cameraAngle: "Eye level",
    shotType: "Medium shot",
    lighting: "Natural soft light",
    composition: "Clear focal subject with readable foreground and background separation",
    emotionalTone: "Grounded and story-driven",
    additionalInstructions: "",
    aspectRatio: "3:4",
  };
}

export function createPageChatMessage(
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  return {
    id: createId("page-message"),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function createDefaultPageCreationState(): PageCreationState {
  const now = new Date().toISOString();
  return {
    illustrationStatus: "not_started",
    settings: createDefaultCreativeSettings(),
    prompt: {
      automaticPrompt: "",
      editedPrompt: null,
      mode: "automatic",
      updatedAt: now,
    },
    references: [],
    chatHistory: [],
    imageVersions: [],
    revision: 1,
    activeJobId: null,
  };
}

export function normalizePageCreationState(
  value: Partial<PageCreationState> | null | undefined,
): PageCreationState {
  const fallback = createDefaultPageCreationState();
  return {
    ...fallback,
    ...value,
    settings: { ...fallback.settings, ...value?.settings },
    prompt: { ...fallback.prompt, ...value?.prompt },
    references: Array.isArray(value?.references) ? value.references : [],
    chatHistory: Array.isArray(value?.chatHistory) ? value.chatHistory : [],
    imageVersions: Array.isArray(value?.imageVersions) ? value.imageVersions : [],
    revision: typeof value?.revision === "number" ? value.revision : 1,
    activeJobId: typeof value?.activeJobId === "string" ? value.activeJobId : null,
  };
}

export function bumpPageRevision(creation: PageCreationState): number {
  return (creation.revision ?? 1) + 1;
}

export function saveEditedPrompt(
  creation: PageCreationState,
  prompt: string,
): PageCreationState {
  return {
    ...creation,
    revision: bumpPageRevision(creation),
    illustrationStatus: "prompt_ready",
    prompt: {
      ...creation.prompt,
      editedPrompt: prompt.trim(),
      mode: "edited",
      updatedAt: new Date().toISOString(),
    },
  };
}

export function resetEditedPrompt(creation: PageCreationState): PageCreationState {
  return {
    ...creation,
    revision: bumpPageRevision(creation),
    prompt: {
      ...creation.prompt,
      editedPrompt: null,
      mode: "automatic",
      updatedAt: new Date().toISOString(),
    },
  };
}

export function addVisualReference(
  creation: PageCreationState,
  pageId: string,
  reference: Pick<VisualReferenceMetadata, "title" | "url" | "description" | "purpose">,
): PageCreationState {
  return {
    ...creation,
    revision: bumpPageRevision(creation),
    references: [
      ...creation.references,
      {
        ...reference,
        id: createId("reference"),
        pageId,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function removeVisualReference(
  creation: PageCreationState,
  referenceId: string,
): PageCreationState {
  return {
    ...creation,
    revision: bumpPageRevision(creation),
    references: creation.references.filter((reference) => reference.id !== referenceId),
  };
}

export function getAdjacentPageBeatId(
  plan: StoryPlan,
  currentPageBeatId: string,
  direction: "previous" | "next",
) {
  const orderedPages = [...plan.pageBeats].sort((a, b) => a.order - b.order);
  const currentIndex = orderedPages.findIndex((page) => page.id === currentPageBeatId);
  const nextIndex = direction === "previous" ? currentIndex - 1 : currentIndex + 1;
  return orderedPages[nextIndex]?.id ?? null;
}

export function canOpenPageCreation(plan: StoryPlan | null, pageBeatId: string) {
  return Boolean(
    plan?.status === "approved" &&
      plan.pageBeats.some((page) => page.id === pageBeatId && page.status === "approved"),
  );
}
