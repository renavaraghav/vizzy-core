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
  canTransition,
  createJobId,
  registerJob,
  getJob,
  getAllJobs,
  startJob,
  completeJob,
  failJob,
  cancelJob,
  retryJob,
  isResponseStale,
  validateJobCompletion,
  deduplicateVersions,
  protectApprovedVersions,
  canStartJob,
  cancelActiveJobsForPage,
  cancelActiveJobsForProject,
  setMockLatency,
  getMockLatency,
  waitMockLatency,
  resetJobRegistry,
} = loadTypeScriptModule("../src/lib/job-manager.ts");

const {
  createDefaultPageCreationState,
  bumpPageRevision,
  saveEditedPrompt,
  resetEditedPrompt,
  addVisualReference,
  removeVisualReference,
} = loadTypeScriptModule("../src/lib/page-creation.ts");

test("Phase 2.0B: Job lifecycle transitions and state machine constraints", () => {
  resetJobRegistry();

  // Valid forward transitions
  assert.equal(canTransition("queued", "running"), true);
  assert.equal(canTransition("queued", "cancelled"), true);
  assert.equal(canTransition("running", "completed"), true);
  assert.equal(canTransition("running", "failed"), true);
  assert.equal(canTransition("running", "cancelled"), true);
  assert.equal(canTransition("failed", "queued"), true); // retry
  assert.equal(canTransition("failed", "cancelled"), true);

  // Terminal state constraints
  assert.equal(canTransition("completed", "running"), false);
  assert.equal(canTransition("completed", "queued"), false);
  assert.equal(canTransition("completed", "cancelled"), false);
  assert.equal(canTransition("cancelled", "running"), false);
  assert.equal(canTransition("cancelled", "queued"), false);
  assert.equal(canTransition("queued", "completed"), false); // cannot skip running
});

test("Phase 2.0B: Unique Job ID generation", () => {
  const id1 = createJobId();
  const id2 = createJobId();
  assert.ok(id1.startsWith("job-"));
  assert.ok(id2.startsWith("job-"));
  assert.notEqual(id1, id2);
});

test("Phase 2.0B: In-memory Job Registry registers, starts, and completes jobs", () => {
  resetJobRegistry();

  const job = registerJob({
    type: "generation",
    projectId: "proj-1",
    pageId: "page-1",
    revision: 1,
    prompt: "A moody street at dusk",
    aspectRatio: "16:9",
    optionCount: 2,
  });

  assert.equal(job.status, "queued");
  assert.equal(job.projectId, "proj-1");
  assert.equal(job.pageId, "page-1");
  assert.equal(job.revision, 1);
  assert.equal(job.retryCount, 0);

  const registered = getJob(job.id);
  assert.ok(registered);
  assert.equal(registered.id, job.id);
  assert.equal(getAllJobs().length, 1);

  const running = startJob(job.id);
  assert.equal(running.status, "running");
  assert.ok(running.startedAt);

  const completed = completeJob(job.id, ["ver-1", "ver-2"]);
  assert.equal(completed.status, "completed");
  assert.ok(completed.completedAt);
  assert.deepEqual(completed.resultVersionIds, ["ver-1", "ver-2"]);
});

test("Phase 2.0B: Request revision tracking and bumping", () => {
  const initial = createDefaultPageCreationState();
  assert.equal(initial.revision, 1);

  const nextRevision = bumpPageRevision(initial);
  assert.equal(nextRevision, 2);

  // Modifying prompt bumps revision
  const withPrompt = saveEditedPrompt(initial, "Updated prompt text");
  assert.equal(withPrompt.revision, 2);
  assert.equal(withPrompt.prompt.editedPrompt, "Updated prompt text");

  // Resetting prompt bumps revision
  const resetPrompt = resetEditedPrompt(withPrompt);
  assert.equal(resetPrompt.revision, 3);

  // Adding visual reference bumps revision
  const withRef = addVisualReference(resetPrompt, "page-1", {
    title: "Lighting study",
    url: "https://example.com/ref.jpg",
    description: "Cold neon glow",
    purpose: "lighting",
  });
  assert.equal(withRef.revision, 4);
  assert.equal(withRef.references.length, 1);

  // Removing visual reference bumps revision
  const refId = withRef.references[0].id;
  const withoutRef = removeVisualReference(withRef, refId);
  assert.equal(withoutRef.revision, 5);
  assert.equal(withoutRef.references.length, 0);
});

test("Phase 2.0B: Stale response protection detects outdated job revisions", () => {
  assert.equal(isResponseStale(1, 1), false);
  assert.equal(isResponseStale(1, 2), true); // Page modified while job was in flight
  assert.equal(isResponseStale(2, 3), true);

  const job = {
    id: "job-stale-1",
    type: "generation",
    status: "running",
    projectId: "proj-1",
    pageId: "page-1",
    revision: 1,
    prompt: "Prompt at rev 1",
    aspectRatio: "16:9",
    optionCount: 1,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: 2,
  };

  // Valid when page is at revision 1
  const validCheck = validateJobCompletion(job, "proj-1", "page-1", 1);
  assert.equal(validCheck.valid, true);

  // Invalid when page has moved to revision 2
  const staleCheck = validateJobCompletion(job, "proj-1", "page-1", 2);
  assert.equal(staleCheck.valid, false);
  assert.ok(staleCheck.reason?.includes("Stale response"));
});

test("Phase 2.0B: Project and Page Isolation validation", () => {
  const job = {
    id: "job-iso-1",
    type: "generation",
    status: "running",
    projectId: "proj-1",
    pageId: "page-1",
    revision: 1,
    prompt: "Prompt",
    aspectRatio: "16:9",
    optionCount: 1,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: 2,
  };

  // Project mismatch
  const projMismatch = validateJobCompletion(job, "proj-2", "page-1", 1);
  assert.equal(projMismatch.valid, false);
  assert.ok(projMismatch.reason?.includes("Project mismatch"));

  // Page mismatch
  const pageMismatch = validateJobCompletion(job, "proj-1", "page-2", 1);
  assert.equal(pageMismatch.valid, false);
  assert.ok(pageMismatch.reason?.includes("Page mismatch"));
});

test("Phase 2.0B: Cancellation aborts AbortController and transitions job", () => {
  resetJobRegistry();

  const job = registerJob({
    type: "generation",
    projectId: "proj-1",
    pageId: "page-1",
    revision: 1,
    prompt: "Rainy roof",
  });

  let aborted = false;
  const mockController = {
    abort: () => {
      aborted = true;
    },
    signal: {},
  };

  startJob(job.id, mockController);
  assert.equal(aborted, false);

  const cancelled = cancelJob(job.id, "User clicked cancel");
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.error, "User clicked cancel");
  assert.equal(aborted, true);

  // Cancelled job rejected by completion validator
  const validation = validateJobCompletion(cancelled, "proj-1", "page-1", 1);
  assert.equal(validation.valid, false);
  assert.ok(validation.reason?.includes("cancelled"));
});

test("Phase 2.0B: Retry with limits allows retrying failed jobs up to maxRetries", () => {
  resetJobRegistry();

  const job = registerJob({
    type: "generation",
    projectId: "proj-1",
    pageId: "page-1",
    revision: 1,
    prompt: "Failing test prompt",
    maxRetries: 2,
  });

  startJob(job.id);
  failJob(job.id, "Service unavailable (503)");

  // Retry 1
  const retry1 = retryJob(job.id);
  assert.equal(retry1.status, "queued");
  assert.equal(retry1.retryCount, 1);
  assert.equal(retry1.error, undefined);

  startJob(job.id);
  failJob(job.id, "Rate limit exceeded (429)");

  // Retry 2
  const retry2 = retryJob(job.id);
  assert.equal(retry2.status, "queued");
  assert.equal(retry2.retryCount, 2);

  startJob(job.id);
  failJob(job.id, "Gateway timeout (504)");

  // Retry 3 should exceed limit and throw
  assert.throws(
    () => retryJob(job.id),
    (err) => err.message.includes("Retry limit reached"),
  );
});

test("Phase 2.0B: Idempotency deduplicates identical image version IDs", () => {
  const existing = [
    { id: "ver-1", imageUrl: "/img1.png", prompt: "p1", createdAt: "t1", selected: true, status: "approved" },
    { id: "ver-2", imageUrl: "/img2.png", prompt: "p2", createdAt: "t2", selected: false, status: "generated" },
  ];

  const incomingWithDuplicate = [
    { id: "ver-2", imageUrl: "/img2.png", prompt: "p2", createdAt: "t2", selected: false, status: "generated" },
    { id: "ver-3", imageUrl: "/img3.png", prompt: "p3", createdAt: "t3", selected: false, status: "generated" },
  ];

  const deduplicated = deduplicateVersions(existing, incomingWithDuplicate);
  assert.equal(deduplicated.length, 3);
  assert.deepEqual(deduplicated.map((v) => v.id), ["ver-1", "ver-2", "ver-3"]);
});

test("Phase 2.0B: Approval safety preserves approved artwork", () => {
  const existingWithApproved = [
    { id: "ver-approved", imageUrl: "/app.png", prompt: "p", createdAt: "t", selected: true, status: "approved" },
  ];

  const incomingNew = [
    { id: "ver-new-1", imageUrl: "/new.png", prompt: "p", createdAt: "t", selected: true, status: "generated" },
  ];

  // When page is approved, newly generated versions must NOT unseat approved artwork
  const protectedResult = protectApprovedVersions(existingWithApproved, incomingNew, true);
  assert.equal(protectedResult.length, 2);

  const approvedVersion = protectedResult.find((v) => v.id === "ver-approved");
  const newVersion = protectedResult.find((v) => v.id === "ver-new-1");

  assert.equal(approvedVersion.selected, true);
  assert.equal(approvedVersion.status, "approved");
  assert.equal(newVersion.selected, false); // New version not auto-selected
  assert.equal(newVersion.status, "generated");
});

test("Phase 2.0B: Duplicate Generate/Refine protection via canStartJob", () => {
  resetJobRegistry();

  assert.equal(canStartJob("proj-1", "page-1"), true);

  const job = registerJob({
    type: "generation",
    projectId: "proj-1",
    pageId: "page-1",
    revision: 1,
    prompt: "Prompt",
  });

  // Queued -> cannot start another
  assert.equal(canStartJob("proj-1", "page-1"), false);
  // Other pages in same project can start
  assert.equal(canStartJob("proj-1", "page-2"), true);

  startJob(job.id);
  // Running -> cannot start another
  assert.equal(canStartJob("proj-1", "page-1"), false);

  completeJob(job.id, ["ver-1"]);
  // Completed -> can start a new job (e.g. refinement)
  assert.equal(canStartJob("proj-1", "page-1"), true);
});

test("Phase 2.0B: Refinement lineage preserves parentVersionId", () => {
  resetJobRegistry();

  const baseJob = registerJob({
    type: "generation",
    projectId: "proj-1",
    pageId: "page-1",
    revision: 1,
    prompt: "Initial generation",
    parentVersionId: null,
  });
  assert.equal(baseJob.type, "generation");
  assert.equal(baseJob.parentVersionId, null);

  const refinementJob = registerJob({
    type: "refinement",
    projectId: "proj-1",
    pageId: "page-1",
    revision: 2,
    prompt: "Refined with dark sky and fog",
    parentVersionId: "ver-original-123",
  });
  assert.equal(refinementJob.type, "refinement");
  assert.equal(refinementJob.parentVersionId, "ver-original-123");
});

test("Phase 2.0B: Navigation safety cancels active jobs for departed page or project", () => {
  resetJobRegistry();

  const jobPage1 = registerJob({
    type: "generation",
    projectId: "proj-1",
    pageId: "page-1",
    revision: 1,
    prompt: "P1",
  });

  const jobPage2 = registerJob({
    type: "generation",
    projectId: "proj-1",
    pageId: "page-2",
    revision: 1,
    prompt: "P2",
  });

  startJob(jobPage1.id);
  startJob(jobPage2.id);

  // Navigate away from page-1
  cancelActiveJobsForPage("proj-1", "page-1", "User left page 1");

  assert.equal(getJob(jobPage1.id)?.status, "cancelled");
  assert.equal(getJob(jobPage2.id)?.status, "running"); // page 2 undisturbed

  // Switch project
  cancelActiveJobsForProject("proj-1", "User switched project");
  assert.equal(getJob(jobPage2.id)?.status, "cancelled");
});

test("Phase 2.0B: Configurable Mock Latency", async () => {
  setMockLatency(10);
  assert.equal(getMockLatency(), 10);

  const start = Date.now();
  await waitMockLatency();
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 8, `Expected at least ~8ms elapsed, got ${elapsed}ms`);

  setMockLatency(0);
  assert.equal(getMockLatency(), 0);
});
