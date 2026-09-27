import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadTypeScriptModule(relativePath, mocks = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });
  const exports = {};
  new Function("exports", "require", outputText)(exports, (specifier) => {
    if (specifier in mocks) return mocks[specifier];
    throw new Error(`Unexpected test import: ${specifier}`);
  });
  return exports;
}

const pageCreation = loadTypeScriptModule("../src/lib/page-creation.ts");
const {
  addPageBeat,
  approveStoryPlan,
  deletePageBeat,
  generateStoryPlan,
  movePageBeat,
  updatePageBeat,
  validatePageCount,
} = loadTypeScriptModule("../src/lib/story-planner.ts", {
  "@/lib/page-creation": pageCreation,
});

function project(overrides = {}) {
  return {
    id: "project-test",
    title: "Night Archive",
    description: "A city archivist discovers that forgotten memories leave physical shadows.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    outputType: "graphic_novel",
    styleBible: {
      projectId: "project-test",
      artStyle: "Expressive ink",
      mood: "Quietly mysterious",
      palette: "Midnight blue and oxidized copper",
      characterDescriptions: "Ira wears a long archive coat and round glasses.",
      visualReferences: "",
      additionalInstructions: "",
    },
    characters: [],
    onboarding: { currentStep: "complete", completedSteps: [], status: "complete" },
    chatHistory: [],
    storyPlan: null,
    selectedPageBeatId: null,
    planningChatHistory: [],
    ...overrides,
  };
}

test("generates the requested number of stable, ordered draft page beats", () => {
  const plan = generateStoryPlan(project(), 8);

  assert.equal(plan.status, "draft");
  assert.equal(plan.targetPageCount, 8);
  assert.equal(plan.pageBeats.length, 8);
  assert.deepEqual(
    plan.pageBeats.map((page) => page.order),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  assert.equal(new Set(plan.pageBeats.map((page) => page.id)).size, 8);
  assert.match(plan.pageBeats[0].visualDirection, /Expressive ink/);
  assert.match(plan.pageBeats[0].description, /city archivist/i);
  assert.equal(plan.pageBeats[0].creation.settings.aspectRatio, "3:4");
});

test("uses structured input sequence and adapts to different story material", () => {
  const structuredProject = project({
    title: "The Long Signal",
    description:
      "1. A radio operator catches an impossible signal.\n2. The signal repeats tomorrow's weather.\n3. A final broadcast names the operator.",
    outputType: "storyboard",
  });
  const plan = generateStoryPlan(structuredProject, 6);

  assert.match(plan.pageBeats[0].title, /radio operator/i);
  assert.ok(plan.pageBeats.some((page) => /tomorrow's weather/i.test(page.description)));
  assert.ok(plan.pageBeats.some((page) => /names the operator/i.test(page.description)));
  assert.doesNotMatch(plan.synopsis, /D-Day/i);
});

test("validates the prototype page-count bounds", () => {
  assert.equal(validatePageCount(1), true);
  assert.equal(validatePageCount(30), true);
  assert.equal(validatePageCount(0), false);
  assert.equal(validatePageCount(31), false);
  assert.equal(validatePageCount(2.5), false);
  assert.throws(() => generateStoryPlan(project(), 31), RangeError);
});

test("edits, adds, deletes, and reorders pages while keeping order consistent", () => {
  let plan = generateStoryPlan(project(), 3);
  const firstId = plan.pageBeats[0].id;
  const secondId = plan.pageBeats[1].id;

  plan = updatePageBeat(plan, firstId, {
    title: "Revised opening",
    dialogue: "Who left this shadow here?",
  });
  assert.equal(plan.pageBeats[0].title, "Revised opening");
  assert.equal(plan.pageBeats[0].dialogue, "Who left this shadow here?");

  plan = addPageBeat(plan, firstId);
  assert.equal(plan.pageBeats.length, 4);
  assert.equal(plan.pageBeats[1].title, "New page");

  const addedId = plan.pageBeats[1].id;
  plan = movePageBeat(plan, addedId, "down");
  assert.equal(plan.pageBeats[2].id, addedId);

  plan = deletePageBeat(plan, secondId);
  assert.equal(plan.pageBeats.length, 3);
  assert.deepEqual(plan.pageBeats.map((page) => page.order), [1, 2, 3]);
  assert.equal(plan.targetPageCount, 3);
});

test("approval marks every page approved and a later edit requires reapproval", () => {
  const draft = generateStoryPlan(project(), 4);
  const approved = approveStoryPlan(draft);

  assert.equal(approved.status, "approved");
  assert.ok(approved.pageBeats.every((page) => page.status === "approved"));

  const revised = updatePageBeat(approved, approved.pageBeats[0].id, {
    description: "A deliberately revised opening beat.",
  });
  assert.equal(revised.status, "draft");
  assert.ok(revised.pageBeats.every((page) => page.status === "draft"));
});

test("story plans survive JSON persistence with stable IDs and ordering", () => {
  const plan = approveStoryPlan(generateStoryPlan(project(), 5));
  const restored = JSON.parse(JSON.stringify(plan));

  assert.deepEqual(
    restored.pageBeats.map((page) => page.id),
    plan.pageBeats.map((page) => page.id),
  );
  assert.deepEqual(
    restored.pageBeats.map((page) => page.order),
    [1, 2, 3, 4, 5],
  );
  assert.equal(restored.status, "approved");
});
