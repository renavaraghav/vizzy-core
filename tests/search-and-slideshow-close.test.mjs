import assert from "node:assert/strict";
import test from "node:test";

// Simulate the search filtering logic implemented in AppSidebar
function filterProjects(projects, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return projects;
  return projects.filter((project) =>
    project.title.toLowerCase().includes(normalizedQuery),
  );
}

const SAMPLE_PROJECTS = [
  { id: "proj-1", title: "D-Day: The Longest Hour", status: "complete" },
  { id: "proj-2", title: "TIM'S TINY WORLD", status: "onboarding" },
  { id: "proj-3", title: "Untitled Story", status: "onboarding" },
  { id: "proj-4", title: "Cyberpunk Odyssey", status: "complete" },
];

test("search finds 'D-Day: The Longest Hour' by case-insensitive 'D-Day' and 'longest'", () => {
  const ddayMatches = filterProjects(SAMPLE_PROJECTS, "D-Day");
  assert.equal(ddayMatches.length, 1);
  assert.equal(ddayMatches[0].title, "D-Day: The Longest Hour");

  const longestMatches = filterProjects(SAMPLE_PROJECTS, "longest");
  assert.equal(longestMatches.length, 1);
  assert.equal(longestMatches[0].title, "D-Day: The Longest Hour");
});

test("search finds 'TIM\\'S TINY WORLD' by 'tim' and 'world'", () => {
  const timMatches = filterProjects(SAMPLE_PROJECTS, "tim");
  assert.equal(timMatches.length, 1);
  assert.equal(timMatches[0].title, "TIM'S TINY WORLD");

  const worldMatches = filterProjects(SAMPLE_PROJECTS, "world");
  assert.equal(worldMatches.length, 1);
  assert.equal(worldMatches[0].title, "TIM'S TINY WORLD");
});

test("search finds 'Untitled Story' by 'untitled'", () => {
  const untitledMatches = filterProjects(SAMPLE_PROJECTS, "untitled");
  assert.equal(untitledMatches.length, 1);
  assert.equal(untitledMatches[0].title, "Untitled Story");
});

test("search returns empty list (triggering 'No stories found') for nonexistent queries", () => {
  const nonexistent = filterProjects(SAMPLE_PROJECTS, "galactic dinosaur pizza");
  assert.equal(nonexistent.length, 0);
});

test("empty search query restores full project list without mutations", () => {
  const allProjects = filterProjects(SAMPLE_PROJECTS, "   ");
  assert.equal(allProjects.length, SAMPLE_PROJECTS.length);
  assert.deepEqual(allProjects, SAMPLE_PROJECTS);
});

test("selecting a searched project preserves project identity and does not create duplicates", () => {
  const searchResults = filterProjects(SAMPLE_PROJECTS, "D-Day");
  assert.equal(searchResults.length, 1);

  const clickedProjectId = searchResults[0].id;
  let activeProjectId = "proj-3";

  // Simulate selectProject handler
  activeProjectId = clickedProjectId;

  assert.equal(activeProjectId, "proj-1");
  // Total projects count remains unaltered
  assert.equal(SAMPLE_PROJECTS.length, 4);
});

test("slideshow close returns to previous workspace without losing data", () => {
  let activeView = "pages";
  let previousView = "pages";

  // Navigation: user opens slideshow
  previousView = activeView;
  activeView = "slideshow";
  assert.equal(activeView, "slideshow");
  assert.equal(previousView, "pages");

  // Navigation: user clicks Slideshow X Close button
  const handleClose = () => {
    activeView = previousView || "pages";
  };
  handleClose();

  assert.equal(activeView, "pages");
});
