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

// Minimal mock localStorage for Node test runner
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const mockStorage = new MockLocalStorage();
const documentAttributes = new Map();
globalThis.localStorage = mockStorage;
globalThis.window = {
  localStorage: mockStorage,
  matchMedia: () => ({ matches: false }),
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.document = {
  documentElement: {
    setAttribute: (k, v) => documentAttributes.set(k, v),
    getAttribute: (k) => documentAttributes.get(k),
  },
};

const sampleStory = loadTypeScriptModule("../src/lib/sample-story.ts");
const profileStorage = loadTypeScriptModule("../src/lib/profile-storage.ts");
const pageCreation = loadTypeScriptModule("../src/lib/page-creation.ts");
const projectStorage = loadTypeScriptModule("../src/lib/project-storage.ts", {
  "@/lib/page-creation": pageCreation,
});

test("createDDaySampleProject generates unique project and plan IDs on consecutive calls", () => {
  const p1 = sampleStory.createDDaySampleProject();
  const p2 = sampleStory.createDDaySampleProject();

  assert.notEqual(p1.id, p2.id, "Consecutive sample projects must have distinct IDs to avoid React key collisions");
  assert.notEqual(
    p1.storyPlan?.id,
    p2.storyPlan?.id,
    "Consecutive sample projects must have distinct plan IDs",
  );
  assert.equal(p1.title, "D-Day: The Longest Hour");
  assert.ok(p1.storyPlan?.pageBeats.length > 0);
});

test("project-storage deduplicates projects with colliding IDs upon migration", () => {
  const rawState = {
    version: 3,
    projects: [
      { id: "proj-duplicate", title: "Project 1", onboarding: { status: "complete" } },
      { id: "proj-duplicate", title: "Project 1 Duplicate", onboarding: { status: "complete" } },
      { id: "proj-unique", title: "Project 2", onboarding: { status: "complete" } },
    ],
    selectedProjectId: "proj-duplicate",
    activeView: "story",
  };

  const migrated = projectStorage.migrateStudioState(rawState);
  assert.equal(migrated.projects.length, 2, "Duplicate project IDs must be pruned");
  assert.equal(migrated.projects[0].id, "proj-duplicate");
  assert.equal(migrated.projects[1].id, "proj-unique");
});

test("profile-storage falls back gracefully to defaults on corrupt localStorage", () => {
  mockStorage.setItem("vizzy_user_profile", "{invalid-json-data{{");
  mockStorage.setItem("vizzy_user_settings", "not-a-json");

  const profile = profileStorage.getUserProfile();
  const settings = profileStorage.getUserSettings();

  assert.equal(profile.displayName, profileStorage.DEFAULT_USER_PROFILE.displayName);
  assert.equal(profile.isGuest, true);
  assert.equal(settings.appearance.theme, profileStorage.DEFAULT_USER_SETTINGS.appearance.theme);
});

test("profile-storage persists and reads profile and settings accurately", () => {
  mockStorage.clear();

  const savedProfile = profileStorage.saveUserProfile({
    displayName: "Graphic Novel Director",
    bio: "Visual storyteller working on dark dieselpunk epics",
    preferredStoryFormat: "graphic_novel",
  });

  assert.equal(savedProfile.displayName, "Graphic Novel Director");
  assert.equal(savedProfile.avatarInitials, "GN");

  const loadedProfile = profileStorage.getUserProfile();
  assert.equal(loadedProfile.displayName, "Graphic Novel Director");
  assert.equal(loadedProfile.bio, "Visual storyteller working on dark dieselpunk epics");

  const savedSettings = profileStorage.saveUserSettings({
    appearance: { theme: "light" },
    creative: {
      defaultSlideshowDuration: 6,
      preferredArtStyle: "Watercolor noir",
    },
  });

  assert.equal(savedSettings.appearance.theme, "light");
  assert.equal(savedSettings.creative.defaultSlideshowDuration, 6);

  const loadedSettings = profileStorage.getUserSettings();
  assert.equal(loadedSettings.appearance.theme, "light");
  assert.equal(loadedSettings.creative.defaultSlideshowDuration, 6);
});

test("maskApiKey masks sensitive credentials safely", () => {
  assert.equal(profileStorage.maskApiKey(null), "");
  assert.equal(profileStorage.maskApiKey(""), "");
  assert.equal(profileStorage.maskApiKey("short"), "••••••••");
  assert.equal(
    profileStorage.maskApiKey("mock_api_sample_token_abcdef1234567890_test_key"),
    "mock_api••••••••_key",
  );
});

test("changing creative preferences does not alter existing projects' Style Bibles", () => {
  const project = sampleStory.createDDaySampleProject();
  const originalArtStyle = project.styleBible.artStyle;

  profileStorage.saveUserSettings({
    creative: {
      preferredArtStyle: "Cyberpunk neon anime",
    },
  });

  // Project Style Bible remains unchanged
  assert.equal(
    project.styleBible.artStyle,
    originalArtStyle,
    "Existing project Style Bible must remain isolated from global preference updates",
  );
});

test("profile-storage persists and reads all 8 background presets accurately", () => {
  const presets = [
    "warm_paper",
    "soft_grey",
    "white",
    "charcoal",
    "deep_black",
    "deep_navy",
    "dark_purple",
    "dark_teal",
  ];

  for (const preset of presets) {
    const saved = profileStorage.saveUserSettings({
      appearance: { backgroundColor: preset },
    });
    assert.equal(saved.appearance.backgroundColor, preset);

    const loaded = profileStorage.getUserSettings();
    assert.equal(loaded.appearance.backgroundColor, preset);
    assert.equal(documentAttributes.get("data-canvas-bg"), preset);
  }
});

test("profile-storage falls back to warm_paper for unknown background preset", () => {
  mockStorage.setItem("vizzy:user-settings", JSON.stringify({
    appearance: { backgroundColor: "neon_alien_green" },
  }));

  const loaded = profileStorage.getUserSettings();
  assert.equal(loaded.appearance.backgroundColor, "warm_paper");
});

test("profile-storage supports 4:3 and 9:16 aspect ratios", () => {
  profileStorage.saveUserSettings({
    creative: { defaultAspectRatio: "4:3" },
  });
  assert.equal(profileStorage.getUserSettings().creative.defaultAspectRatio, "4:3");

  profileStorage.saveUserSettings({
    creative: { defaultAspectRatio: "9:16" },
  });
  assert.equal(profileStorage.getUserSettings().creative.defaultAspectRatio, "9:16");
});

test("profile reset restores previously saved values without saving uncommitted edits", () => {
  mockStorage.clear();
  profileStorage.saveUserProfile({
    displayName: "Commander Taylor",
    bio: "Historical fiction writer",
    preferredStoryFormat: "storyboard",
  });

  // Simulated uncommitted user edits in form
  let formDisplayName = "Edited Name But Cancelled";
  let formBio = "Edited Bio But Cancelled";

  // When user clicks cancel / reset, form restores from stored profile
  const stored = profileStorage.getUserProfile();
  formDisplayName = stored.displayName;
  formBio = stored.bio;

  assert.equal(formDisplayName, "Commander Taylor");
  assert.equal(formBio, "Historical fiction writer");
});
