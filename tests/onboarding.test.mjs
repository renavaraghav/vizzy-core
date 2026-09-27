import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadOnboardingModule() {
  const source = readFileSync(new URL("../src/lib/onboarding.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });
  const exports = {};
  const localRequire = (specifier) => {
    if (specifier === "@/lib/constants") {
      return { DEFAULT_PROJECT_TITLE: "Untitled Story" };
    }
    throw new Error(`Unexpected test import: ${specifier}`);
  };

  new Function("exports", "require", outputText)(exports, localRequire);
  return exports;
}

const { answerOnboardingQuestion, createProject } = loadOnboardingModule();

test("completes a project onboarding conversation", () => {
  let project = createProject();
  const answers = [
    "The Glass City",
    "A courier discovers that the city archives are quietly rewriting everyone's memories.",
    "Graphic novel",
    "Expressive ink with cinematic lighting",
    "Deep blue, oxidized copper, and candlelight",
    "Intimate, mysterious, and cautiously hopeful",
    "Mara is a sharp-eyed courier in a weathered yellow coat.",
    "European noir photography and rain-softened architecture",
    "Keep technology tactile and avoid pristine futuristic surfaces.",
  ];

  for (const answer of answers) {
    project = answerOnboardingQuestion(project, answer);
  }

  assert.equal(project.title, "The Glass City");
  assert.equal(project.outputType, "graphic_novel");
  assert.equal(project.onboarding.status, "complete");
  assert.equal(project.onboarding.currentStep, "complete");
  assert.equal(project.styleBible.artStyle, "Expressive ink with cinematic lighting");
  assert.equal(project.characters.length, 1);
  assert.match(project.chatHistory.at(-1).content, /story world is ready/i);
});

test("keeps required steps active until a valid answer is supplied", () => {
  let project = createProject();
  project = answerOnboardingQuestion(project, "Project North");
  project = answerOnboardingQuestion(project, "A quiet mystery on a polar research station.");
  project = answerOnboardingQuestion(project, "an interactive experience");

  assert.equal(project.onboarding.currentStep, "format");
  assert.equal(project.outputType, null);
  assert.match(project.chatHistory.at(-1).content, /choose graphic novel, storyboard, or visual book/i);

  project = answerOnboardingQuestion(project, "Storyboard");
  assert.equal(project.outputType, "storyboard");
  assert.equal(project.onboarding.currentStep, "art_style");
});

test("supports optional skips and creates independent project IDs", () => {
  let project = createProject();
  const secondProject = createProject();

  project = answerOnboardingQuestion(project, "Small Hours");
  project = answerOnboardingQuestion(project, "Two strangers cross a sleeping city before sunrise.");
  project = answerOnboardingQuestion(project, "Visual book");
  project = answerOnboardingQuestion(project, "Skip for now");

  assert.notEqual(project.id, secondProject.id);
  assert.equal(project.styleBible.artStyle, "");
  assert.equal(project.onboarding.currentStep, "palette");
});

test("continues an incomplete conversation after JSON persistence", () => {
  let project = createProject();
  project = answerOnboardingQuestion(project, "Paper Moons");
  project = answerOnboardingQuestion(
    project,
    "A child maps a town where every abandoned house contains a different night sky.",
  );

  const restoredProject = JSON.parse(JSON.stringify(project));
  const continuedProject = answerOnboardingQuestion(restoredProject, "Visual book");

  assert.equal(continuedProject.title, "Paper Moons");
  assert.equal(continuedProject.outputType, "visual_book");
  assert.equal(continuedProject.onboarding.currentStep, "art_style");
  assert.equal(continuedProject.chatHistory.length, project.chatHistory.length + 2);
});
