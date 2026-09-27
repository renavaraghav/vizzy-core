import type { ChatMessage, PageBeat, Project, StoryPlan } from "@/types/domain";
import { createDefaultPageCreationState } from "@/lib/page-creation";

export const MIN_PAGE_COUNT = 1;
export const MAX_PAGE_COUNT = 30;

const STRUCTURE_LABELS = [
  "Opening image",
  "Establish the world",
  "Define the story question",
  "Develop the situation",
  "Escalate the pressure",
  "Midpoint shift",
  "Complication",
  "Decision",
  "Consequence",
  "Approach the climax",
  "Climactic beat",
  "Closing image",
];

function createId(prefix: string) {
  const uniquePart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${uniquePart}`;
}

export function createPlanningMessage(content: string): ChatMessage {
  return {
    id: createId("message"),
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  };
}

export function validatePageCount(value: number) {
  return Number.isInteger(value) && value >= MIN_PAGE_COUNT && value <= MAX_PAGE_COUNT;
}

function extractStructuredNotes(story: string) {
  const lines = story
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const structured = lines
    .map((line) => line.replace(/^(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((line, index) => line !== lines[index] || /^(?:[-*•]|\d+[.)])\s*/.test(lines[index]));

  return structured.length >= 2 ? structured : [];
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1).trim()}…` : value;
}

function titleFromNote(note: string, order: number) {
  const clean = note.split(/[.!?]/)[0]?.trim();
  return clean ? truncate(clean, 48) : `Story beat ${order}`;
}

function structureLabel(index: number, count: number) {
  if (count === 1) return "Complete story image";
  const labelIndex = Math.round((index / (count - 1)) * (STRUCTURE_LABELS.length - 1));
  return STRUCTURE_LABELS[labelIndex];
}

function actLabel(index: number, count: number) {
  const progress = (index + 1) / count;
  if (progress <= 0.33) return "Act I";
  if (progress <= 0.67) return "Act II";
  return "Act III";
}

function visualDirectionFor(project: Project) {
  const details = [
    project.styleBible.artStyle && `Style: ${project.styleBible.artStyle}`,
    project.styleBible.mood && `Mood: ${project.styleBible.mood}`,
    project.styleBible.palette && `Palette: ${project.styleBible.palette}`,
    project.styleBible.characterDescriptions &&
      `Maintain character continuity from: ${project.styleBible.characterDescriptions}`,
  ].filter(Boolean);

  return details.length
    ? details.join(". ")
    : "Define a clear composition and visual focus that supports this beat.";
}

function sparseDescription(project: Project, index: number, count: number) {
  const concept = truncate(project.description, 150);
  const label = structureLabel(index, count).toLowerCase();
  return `Use this page as the ${label} for the saved concept: “${concept}” Keep the event editable rather than inventing story details.`;
}

export function generateStoryPlan(project: Project, pageCount: number): StoryPlan {
  if (!validatePageCount(pageCount)) {
    throw new RangeError(`Page count must be a whole number from ${MIN_PAGE_COUNT} to ${MAX_PAGE_COUNT}.`);
  }

  const now = new Date().toISOString();
  const id = createId("plan");
  const notes = extractStructuredNotes(project.description);
  const visualDirection = visualDirectionFor(project);
  const pageBeats: PageBeat[] = Array.from({ length: pageCount }, (_, index) => {
    const noteIndex = notes.length
      ? Math.min(Math.floor((index * notes.length) / pageCount), notes.length - 1)
      : -1;
    const note = noteIndex >= 0 ? notes[noteIndex] : "";
    const order = index + 1;

    return {
      id: createId("page-beat"),
      storyPlanId: id,
      order,
      title: note ? titleFromNote(note, order) : structureLabel(index, pageCount),
      description: note
        ? `Develop this saved story note without adding unsupported events: ${note}`
        : sparseDescription(project, index, pageCount),
      visualDirection,
      narration: "[Add narration if this page needs it.]",
      dialogue: "[Add dialogue or leave the page silent.]",
      optionalActLabel: actLabel(index, pageCount),
      status: "draft",
      creation: createDefaultPageCreationState(),
    };
  });

  return {
    id,
    projectId: project.id,
    synopsis: project.description,
    targetPageCount: pageCount,
    status: "draft",
    pageBeats,
    createdAt: now,
    updatedAt: now,
  };
}

function normalizePlan(plan: StoryPlan, pageBeats: PageBeat[]): StoryPlan {
  const updatedAt = new Date().toISOString();
  return {
    ...plan,
    status: "draft",
    targetPageCount: pageBeats.length,
    updatedAt,
    pageBeats: pageBeats.map((page, index) => ({
      ...page,
      order: index + 1,
      status: "draft",
    })),
  };
}

export function updatePageBeat(
  plan: StoryPlan,
  pageBeatId: string,
  updates: Partial<Pick<PageBeat, "title" | "description" | "visualDirection" | "narration" | "dialogue" | "optionalActLabel">>,
) {
  return normalizePlan(
    plan,
    plan.pageBeats.map((page) => (page.id === pageBeatId ? { ...page, ...updates } : page)),
  );
}

export function addPageBeat(plan: StoryPlan, afterPageBeatId?: string | null) {
  if (plan.pageBeats.length >= MAX_PAGE_COUNT) return plan;

  const page: PageBeat = {
    id: createId("page-beat"),
    storyPlanId: plan.id,
    order: plan.pageBeats.length + 1,
    title: "New page",
    description: "Describe what changes on this page and why it matters to the sequence.",
    visualDirection: "Define the composition, subject, setting, and visual emphasis.",
    narration: "",
    dialogue: "",
    optionalActLabel: "",
    status: "draft",
    creation: createDefaultPageCreationState(),
  };
  const insertionIndex = afterPageBeatId
    ? plan.pageBeats.findIndex((candidate) => candidate.id === afterPageBeatId) + 1
    : plan.pageBeats.length;
  const pageBeats = [...plan.pageBeats];
  pageBeats.splice(Math.max(insertionIndex, 0), 0, page);

  return normalizePlan(plan, pageBeats);
}

export function deletePageBeat(plan: StoryPlan, pageBeatId: string) {
  return normalizePlan(
    plan,
    plan.pageBeats.filter((page) => page.id !== pageBeatId),
  );
}

export function movePageBeat(plan: StoryPlan, pageBeatId: string, direction: "up" | "down") {
  const index = plan.pageBeats.findIndex((page) => page.id === pageBeatId);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= plan.pageBeats.length) return plan;

  const pageBeats = [...plan.pageBeats];
  [pageBeats[index], pageBeats[nextIndex]] = [pageBeats[nextIndex], pageBeats[index]];
  return normalizePlan(plan, pageBeats);
}

export function approveStoryPlan(plan: StoryPlan): StoryPlan {
  if (plan.pageBeats.length === 0) return plan;

  return {
    ...plan,
    status: "approved",
    updatedAt: new Date().toISOString(),
    pageBeats: plan.pageBeats.map((page) => ({ ...page, status: "approved" })),
  };
}
