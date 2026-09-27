import type {
  AIJob,
  ImageVersion,
  JobStatus,
  JobType,
  PageAspectRatio,
} from "@/types/domain";

/**
 * Valid state transitions for the AIJob lifecycle.
 * Terminal states (completed, cancelled) cannot transition to any other state.
 */
const VALID_TRANSITIONS: Record<JobStatus, readonly JobStatus[]> = {
  queued: ["running", "cancelled"],
  running: ["completed", "failed", "cancelled"],
  failed: ["queued", "cancelled"], // 'queued' represents a retry
  completed: [], // terminal
  cancelled: [], // terminal
};

export function canTransition(current: JobStatus, target: JobStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false;
}

export function createJobId(): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `job-${uuid}`;
}

export interface CreateJobParams {
  type: JobType;
  projectId: string;
  pageId: string;
  revision: number;
  prompt: string;
  aspectRatio?: PageAspectRatio;
  optionCount?: number;
  parentVersionId?: string | null;
  maxRetries?: number;
}

// In-memory Job Registry
const jobRegistry = new Map<string, AIJob>();
const abortControllers = new Map<string, AbortController>();
const processedVersionIds = new Set<string>();
const listeners = new Set<() => void>();

let globalMockLatencyMs = 0;

/** Configure deterministic mock latency for tests / simulation */
export function setMockLatency(ms: number): void {
  globalMockLatencyMs = Math.max(0, ms);
}

export function getMockLatency(): number {
  return globalMockLatencyMs;
}

export async function waitMockLatency(overrideMs?: number): Promise<void> {
  const ms = overrideMs !== undefined ? overrideMs : globalMockLatencyMs;
  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener errors
    }
  });
}

export function subscribeToJobs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Register a new AIJob in the registry.
 */
export function registerJob(params: CreateJobParams): AIJob {
  const id = createJobId();
  const job: AIJob = {
    id,
    type: params.type,
    status: "queued",
    projectId: params.projectId,
    pageId: params.pageId,
    revision: params.revision,
    prompt: params.prompt,
    aspectRatio: params.aspectRatio ?? "3:4",
    optionCount: params.optionCount ?? 1,
    parentVersionId: params.parentVersionId ?? null,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: params.maxRetries ?? 2,
  };

  jobRegistry.set(id, job);
  notifyListeners();
  return { ...job };
}

export function getJob(jobId: string): AIJob | undefined {
  const job = jobRegistry.get(jobId);
  return job ? { ...job } : undefined;
}

export function getAllJobs(): AIJob[] {
  return Array.from(jobRegistry.values()).map((job) => ({ ...job }));
}

export function getActiveJobForPage(projectId: string, pageId: string): AIJob | undefined {
  for (const job of jobRegistry.values()) {
    if (
      job.projectId === projectId &&
      job.pageId === pageId &&
      (job.status === "queued" || job.status === "running")
    ) {
      return { ...job };
    }
  }
  return undefined;
}

/** Check whether a new generation/refinement can be started for this page */
export function canStartJob(projectId: string, pageId: string): boolean {
  return getActiveJobForPage(projectId, pageId) === undefined;
}

/**
 * Start execution of a queued job, optionally attaching an AbortController.
 */
export function startJob(jobId: string, controller?: AbortController): AIJob {
  const job = jobRegistry.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  if (!canTransition(job.status, "running")) {
    throw new Error(`Cannot transition job ${jobId} from ${job.status} to running`);
  }

  job.status = "running";
  job.startedAt = new Date().toISOString();

  if (controller) {
    abortControllers.set(jobId, controller);
  }

  notifyListeners();
  return { ...job };
}

/**
 * Complete a running job with generated image version IDs.
 */
export function completeJob(jobId: string, versionIds: string[]): AIJob {
  const job = jobRegistry.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  if (!canTransition(job.status, "completed")) {
    throw new Error(`Cannot transition job ${jobId} from ${job.status} to completed`);
  }

  job.status = "completed";
  job.completedAt = new Date().toISOString();
  job.resultVersionIds = versionIds;

  // Track processed versions for idempotency
  versionIds.forEach((vid) => processedVersionIds.add(vid));
  abortControllers.delete(jobId);

  notifyListeners();
  return { ...job };
}

/**
 * Mark a job as failed with an error message.
 */
export function failJob(jobId: string, error: string): AIJob {
  const job = jobRegistry.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  if (!canTransition(job.status, "failed")) {
    throw new Error(`Cannot transition job ${jobId} from ${job.status} to failed`);
  }

  job.status = "failed";
  job.error = error;
  job.completedAt = new Date().toISOString();
  abortControllers.delete(jobId);

  notifyListeners();
  return { ...job };
}

/**
 * Cancel an active (queued or running) job.
 */
export function cancelJob(jobId: string, reason = "Job cancelled by user"): AIJob {
  const job = jobRegistry.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  if (!canTransition(job.status, "cancelled")) {
    throw new Error(`Cannot transition job ${jobId} from ${job.status} to cancelled`);
  }

  // Trigger abort if controller exists
  const controller = abortControllers.get(jobId);
  if (controller) {
    try {
      controller.abort();
    } catch {
      // ignore
    }
    abortControllers.delete(jobId);
  }

  job.status = "cancelled";
  job.error = reason;
  job.completedAt = new Date().toISOString();

  notifyListeners();
  return { ...job };
}

/** Cancel all active jobs for a specific page */
export function cancelActiveJobsForPage(projectId: string, pageId: string, reason?: string): void {
  for (const job of jobRegistry.values()) {
    if (
      job.projectId === projectId &&
      job.pageId === pageId &&
      (job.status === "queued" || job.status === "running")
    ) {
      cancelJob(job.id, reason ?? `Page navigation: cancelled active job for page ${pageId}`);
    }
  }
}

/** Cancel all active jobs for an entire project */
export function cancelActiveJobsForProject(projectId: string, reason?: string): void {
  for (const job of jobRegistry.values()) {
    if (
      job.projectId === projectId &&
      (job.status === "queued" || job.status === "running")
    ) {
      cancelJob(job.id, reason ?? `Project switch: cancelled active job for project ${projectId}`);
    }
  }
}

/**
 * Retry a failed job if under maxRetries limit.
 */
export function retryJob(jobId: string): AIJob {
  const job = jobRegistry.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  if (!canTransition(job.status, "queued")) {
    throw new Error(`Cannot retry job ${jobId} from status ${job.status}`);
  }
  if (job.retryCount >= job.maxRetries) {
    throw new Error(`Retry limit reached (${job.maxRetries}) for job ${jobId}`);
  }

  job.status = "queued";
  job.retryCount += 1;
  job.error = undefined;
  job.startedAt = undefined;
  job.completedAt = undefined;

  notifyListeners();
  return { ...job };
}

/**
 * Check if a response is stale based on the current page revision.
 * If the current page revision is greater than the job's revision,
 * the response is obsolete and should not overwrite newer creative state.
 */
export function isResponseStale(jobRevision: number, currentRevision: number): boolean {
  return currentRevision > jobRevision;
}

/**
 * Validate whether a completed job is eligible to apply to the target page.
 */
export function validateJobCompletion(
  job: AIJob,
  currentProjectId: string,
  targetPageId: string,
  currentRevision: number,
): { valid: boolean; reason?: string } {
  if (job.status === "cancelled") {
    return { valid: false, reason: "Job was cancelled; discarding response." };
  }
  if (job.projectId !== currentProjectId) {
    return {
      valid: false,
      reason: `Project mismatch: job belongs to project ${job.projectId}, active is ${currentProjectId}`,
    };
  }
  if (job.pageId !== targetPageId) {
    return {
      valid: false,
      reason: `Page mismatch: job belongs to page ${job.pageId}, active is ${targetPageId}`,
    };
  }
  if (isResponseStale(job.revision, currentRevision)) {
    return {
      valid: false,
      reason: `Stale response: job was created at revision ${job.revision}, page is at revision ${currentRevision}`,
    };
  }
  return { valid: true };
}

/**
 * Deduplicate versions for idempotency.
 * If the same image version arrives multiple times, only append once.
 */
export function deduplicateVersions(
  existingVersions: ImageVersion[],
  newVersions: ImageVersion[],
): ImageVersion[] {
  const existingIds = new Set(existingVersions.map((v) => v.id));
  const uniqueIncoming = newVersions.filter((v) => !existingIds.has(v.id));
  return [...existingVersions, ...uniqueIncoming];
}

/**
 * Approval safety: ensures approved artwork is never silently overwritten or unselected.
 */
export function protectApprovedVersions(
  existingVersions: ImageVersion[],
  newVersions: ImageVersion[],
  isPageApproved: boolean,
): ImageVersion[] {
  const hasApprovedVersion = existingVersions.some((v) => v.status === "approved" || (isPageApproved && v.selected));

  if (!hasApprovedVersion) {
    return deduplicateVersions(existingVersions, newVersions);
  }

  // Preserve existing approved selection; incoming versions are added without superseding selected status
  const safeNewVersions = newVersions.map((v) => ({
    ...v,
    selected: false,
    status: "generated" as const,
  }));

  return deduplicateVersions(existingVersions, safeNewVersions);
}

/**
 * Clean up old finished jobs (completed or cancelled).
 */
export function cleanupFinishedJobs(olderThanMs = 300000): void {
  const cutoff = Date.now() - olderThanMs;
  for (const [id, job] of jobRegistry.entries()) {
    if (job.status === "completed" || job.status === "cancelled") {
      const finishedTime = job.completedAt ? new Date(job.completedAt).getTime() : 0;
      if (finishedTime && finishedTime < cutoff) {
        jobRegistry.delete(id);
        abortControllers.delete(id);
      }
    }
  }
}

/** Reset in-memory registry (used by tests) */
export function resetJobRegistry(): void {
  jobRegistry.clear();
  abortControllers.clear();
  processedVersionIds.clear();
  listeners.clear();
  globalMockLatencyMs = 0;
}
