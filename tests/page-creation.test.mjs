import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadTypeScriptModule(relativePath) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  new Function("exports", "require", outputText)(exports, (specifier) => {
    throw new Error(`Unexpected test import: ${specifier}`);
  });
  return exports;
}

const {
  addVisualReference,
  canOpenPageCreation,
  createDefaultPageCreationState,
  getAdjacentPageBeatId,
  removeVisualReference,
  resetEditedPrompt,
  saveEditedPrompt,
} = loadTypeScriptModule("../src/lib/page-creation.ts");
const { buildIllustrationPrompt } = loadTypeScriptModule("../src/lib/illustration-prompt.ts");

function fixture() {
  const creation = createDefaultPageCreationState();
  const page = {
    id: "page-1",
    storyPlanId: "plan-1",
    order: 1,
    title: "The flooded archive",
    description: "Ira enters the archive as shallow water reflects the shelves.",
    visualDirection: "Keep Ira small against the towering shelves.",
    narration: "The archive remembered the rain.",
    dialogue: "Ira: This should be impossible.",
    optionalActLabel: "Act I",
    status: "approved",
    creation: {
      ...creation,
      settings: {
        ...creation.settings,
        lighting: "Copper emergency lights",
        additionalInstructions: "Keep the doorway visible.",
        aspectRatio: "16:9",
      },
    },
  };
  const project = {
    id: "project-1",
    title: "Night Archive",
    description: "An archivist discovers that forgotten memories leave physical shadows.",
    outputType: "graphic_novel",
    styleBible: {
      projectId: "project-1",
      artStyle: "Expressive ink",
      mood: "Quietly mysterious",
      palette: "Midnight blue and oxidized copper",
      characterDescriptions: "Ira wears a long archive coat and round glasses.",
      visualReferences: "Architectural photography with deep vanishing points.",
      additionalInstructions: "No modern screens.",
    },
    characters: [],
    onboarding: { currentStep: "complete", completedSteps: [], status: "complete" },
    chatHistory: [],
    storyPlan: null,
    selectedPageBeatId: page.id,
    planningChatHistory: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  return { project, page };
}

test("builds a deterministic prompt from the complete Style Bible and page settings", () => {
  const { project, page } = fixture();
  const prompt = buildIllustrationPrompt(project, page);

  assert.equal(prompt, buildIllustrationPrompt(project, page));
  for (const expected of [
    "Night Archive",
    "Graphic novel",
    "Expressive ink",
    "Quietly mysterious",
    "Midnight blue and oxidized copper",
    "Ira wears a long archive coat",
    "Architectural photography",
    "No modern screens",
    "The flooded archive",
    "Keep the doorway visible",
    "16:9",
  ]) assert.match(prompt, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("omits missing optional values and deduplicates repeated source text", () => {
  const { project, page } = fixture();
  project.styleBible.mood = "";
  page.narration = "";
  page.dialogue = "";
  page.visualDirection = project.styleBible.artStyle;
  const prompt = buildIllustrationPrompt(project, page);

  assert.doesNotMatch(prompt, /undefined|null/);
  assert.equal(prompt.match(/Expressive ink/g)?.length, 1);
  assert.doesNotMatch(prompt, /^Narration:/m);
});

test("does not repeat a planner-generated Style Bible summary as page direction", () => {
  const { project, page } = fixture();
  page.visualDirection = `Style: ${project.styleBible.artStyle}. Mood: ${project.styleBible.mood}. Palette: ${project.styleBible.palette}. Maintain character continuity from: ${project.styleBible.characterDescriptions}`;
  const prompt = buildIllustrationPrompt(project, page);

  assert.equal(prompt.match(/Expressive ink/g)?.length, 1);
  assert.doesNotMatch(prompt, /^Visual direction:/m);
});

test("keeps edited prompts explicit until reset", () => {
  let creation = createDefaultPageCreationState();
  creation.prompt.automaticPrompt = "Automatic prompt";
  creation = saveEditedPrompt(creation, "A deliberate user edit");
  const changedSettings = {
    ...creation,
    settings: { ...creation.settings, lighting: "Moonlit" },
  };

  assert.equal(changedSettings.prompt.mode, "edited");
  assert.equal(changedSettings.prompt.editedPrompt, "A deliberate user edit");
  creation = resetEditedPrompt(changedSettings);
  assert.equal(creation.prompt.mode, "automatic");
  assert.equal(creation.prompt.editedPrompt, null);
});

test("adds and removes reference metadata without leaking between pages", () => {
  const firstPage = addVisualReference(createDefaultPageCreationState(), "page-1", {
    title: "Station light",
    url: "https://example.com/light",
    description: "Use the amber falloff.",
    purpose: "lighting",
  });
  const secondPage = createDefaultPageCreationState();

  assert.equal(firstPage.references.length, 1);
  assert.equal(firstPage.references[0].pageId, "page-1");
  assert.equal(secondPage.references.length, 0);
  assert.equal(removeVisualReference(firstPage, firstPage.references[0].id).references.length, 0);
});

test("opens only approved pages and navigates previous and next in order", () => {
  const { page } = fixture();
  const plan = {
    id: "plan-1",
    projectId: "project-1",
    synopsis: "",
    targetPageCount: 3,
    status: "approved",
    createdAt: "",
    updatedAt: "",
    pageBeats: [
      { ...page, id: "page-2", order: 2 },
      { ...page, id: "page-1", order: 1 },
      { ...page, id: "page-3", order: 3 },
    ],
  };

  assert.equal(getAdjacentPageBeatId(plan, "page-2", "previous"), "page-1");
  assert.equal(getAdjacentPageBeatId(plan, "page-2", "next"), "page-3");
  assert.equal(getAdjacentPageBeatId(plan, "page-1", "previous"), null);
  assert.equal(canOpenPageCreation(plan, "page-2"), true);
  assert.equal(canOpenPageCreation({ ...plan, status: "draft" }, "page-2"), false);
  assert.equal(canOpenPageCreation(plan, "missing-page"), false);
});
