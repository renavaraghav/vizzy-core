"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { getOutputTypeLabel } from "@/lib/onboarding";
import {
  registerJob,
  startJob,
  completeJob,
  failJob,
  cancelJob,
  retryJob,
  canStartJob,
  validateJobCompletion,
  cancelActiveJobsForPage,
  getJob,
} from "@/lib/job-manager";
import type {
  ImageVersion,
  PageBeat,
  PageCreativeSettings,
  Project,
  VisualReferenceMetadata,
  VisualReferencePurpose,
} from "@/types/domain";

interface PageCreationWorkspaceProps {
  project: Project;
  page: PageBeat;
  onBack: () => void;
  onNavigate: (direction: "previous" | "next") => void;
  onUpdateSettings: (updates: Partial<PageCreativeSettings>) => void;
  onSavePrompt: (prompt: string) => void;
  onResetPrompt: () => void;
  onSaveImages: (versions: ImageVersion[]) => void;
  onSelectImage: (versionId: string) => void;
  onAddReference: (
    reference: Pick<VisualReferenceMetadata, "title" | "url" | "description" | "purpose">,
  ) => void;
  onRemoveReference: (referenceId: string) => void;
}

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-[#625b50]/15 bg-white/55 px-3 py-2.5 text-[10px] text-[#3e3b35] outline-none transition focus:border-[#777fd7]/45 focus:bg-white/80";
const labelClass = "text-[8px] font-bold uppercase tracking-[0.13em] text-[#8c857b]";

function PromptEditor({
  page,
  onSave,
  onReset,
}: {
  page: PageBeat;
  onSave: (prompt: string) => void;
  onReset: () => void;
}) {
  const activePrompt = page.creation.prompt.editedPrompt ?? page.creation.prompt.automaticPrompt;
  const [draft, setDraft] = useState(activePrompt);
  const [dirty, setDirty] = useState(false);
  const displayedPrompt = dirty ? draft : activePrompt;
  const isEdited = page.creation.prompt.mode === "edited";

  return (
    <section className="rounded-2xl border border-[#625b50]/10 bg-[#f7f2ea]/90 p-4 shadow-[0_10px_30px_rgba(75,67,58,.07)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] font-semibold text-[#34342f]">Illustration prompt</h3>
            <span
              className={`rounded-full px-2 py-1 text-[7px] font-bold uppercase tracking-[0.12em] ${
                isEdited ? "bg-[#777fd7]/12 text-[#656cb7]" : "bg-[#dce6d4] text-[#607251]"
              }`}
            >
              {isEdited ? "Edited" : "Automatic"}
            </span>
          </div>
          <p className="mt-1 text-[9px] text-[#89837a]">
            Deterministically assembled from saved project and page details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDirty(false);
            onReset();
          }}
          disabled={!isEdited && !dirty}
          className="rounded-lg border border-[#625b50]/12 bg-white/45 px-2.5 py-2 text-[8px] font-semibold text-[#69645d] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Reset to automatic
        </button>
      </div>
      <textarea
        aria-label="Illustration prompt"
        value={displayedPrompt}
        onChange={(event) => {
          setDraft(event.target.value);
          setDirty(true);
        }}
        rows={14}
        className="studio-scrollbar mt-3 w-full resize-y rounded-xl border border-[#625b50]/12 bg-[#fffdf9]/75 p-3 font-mono text-[9px] leading-[1.65] text-[#4d4942] outline-none focus:border-[#777fd7]/40"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[8px] text-[#989188]">
          {dirty ? "Unsaved prompt changes" : "Prompt state saved locally"}
        </p>
        <button
          type="button"
          onClick={() => {
            onSave(displayedPrompt);
            setDraft(displayedPrompt);
            setDirty(false);
          }}
          disabled={!displayedPrompt.trim() || (!dirty && isEdited)}
          className="rounded-lg bg-[#282927] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#3a3b38] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save prompt changes
        </button>
      </div>
    </section>
  );
}

function ReferenceLibrary({
  page,
  onAdd,
  onRemove,
}: {
  page: PageBeat;
  onAdd: PageCreationWorkspaceProps["onAddReference"];
  onRemove: (referenceId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState<VisualReferencePurpose>("environment");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      purpose,
    });
    setTitle("");
    setUrl("");
    setDescription("");
  }

  return (
    <section className="rounded-2xl border border-[#625b50]/10 bg-[#f7f2ea]/90 p-4 shadow-[0_10px_30px_rgba(75,67,58,.07)]">
      <div>
        <h3 className="text-[11px] font-semibold text-[#34342f]">Visual references</h3>
        <p className="mt-1 text-[9px] text-[#89837a]">
          Save links and notes only. Vizzy does not upload or copy image files.
        </p>
      </div>

      {page.creation.references.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {page.creation.references.map((reference) => (
            <article key={reference.id} className="rounded-xl border border-[#625b50]/10 bg-white/45 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold text-[#44413a]">{reference.title}</p>
                  <p className="mt-1 text-[7px] font-bold uppercase tracking-[0.12em] text-[#777fd7]">
                    {reference.purpose}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(reference.id)}
                  className="rounded-md px-2 py-1 text-[8px] text-[#9a6f67] hover:bg-[#9a6f67]/10"
                  aria-label={`Remove ${reference.title}`}
                >
                  Remove
                </button>
              </div>
              {reference.description && (
                <p className="mt-2 line-clamp-2 text-[8px] leading-relaxed text-[#777269]">
                  {reference.description}
                </p>
              )}
              {reference.url && (
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block truncate text-[8px] text-[#656cb7] underline decoration-[#656cb7]/25 underline-offset-2"
                >
                  {reference.url}
                </a>
              )}
            </article>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 grid gap-3 border-t border-[#625b50]/10 pt-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Reference title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} placeholder="Rain-soaked station" />
        </label>
        <label>
          <span className={labelClass}>Purpose</span>
          <select value={purpose} onChange={(event) => setPurpose(event.target.value as VisualReferencePurpose)} className={fieldClass}>
            {(["character", "costume", "environment", "lighting", "composition"] as const).map((item) => (
              <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>URL</span>
          <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} className={fieldClass} placeholder="https://example.com/reference" />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>What should this inform?</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`${fieldClass} resize-none`} rows={2} placeholder="Describe the useful visual qualities without adding story facts." />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={!title.trim()} className="rounded-lg bg-[#777fd7] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#686fca] disabled:cursor-not-allowed disabled:opacity-40">
            Add reference metadata
          </button>
        </div>
      </form>
    </section>
  );
}

export function PageCreationWorkspace({
  project,
  page,
  onBack,
  onNavigate,
  onUpdateSettings,
  onSavePrompt,
  onResetPrompt,
  onSaveImages,
  onSelectImage,
  onAddReference,
  onRemoveReference,
}: PageCreationWorkspaceProps) {
  const [optionCount, setOptionCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [lastFailedJobId, setLastFailedJobId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState("");
  const [generationNotice, setGenerationNotice] = useState("");
  const pages = [...(project.storyPlan?.pageBeats ?? [])].sort((a, b) => a.order - b.order);
  const pageIndex = pages.findIndex((candidate) => candidate.id === page.id);
  const aspectClass =
    page.creation.settings.aspectRatio === "16:9"
      ? "aspect-video"
      : page.creation.settings.aspectRatio === "1:1"
        ? "aspect-square"
        : "aspect-[3/4]";
  const selectedImage =
    page.creation.imageVersions.find((version) => version.selected) ??
    page.creation.imageVersions[0] ??
    null;

  // Navigation Safety: Cancel any active background jobs on unmount or page change
  useEffect(() => {
    return () => {
      cancelActiveJobsForPage(project.id, page.id, "Navigated away from page workspace");
    };
  }, [project.id, page.id]);

  async function generateImages(retryTargetJobId?: string) {
    if (!canStartJob(project.id, page.id)) {
      setGenerationNotice("A generation task is already active for this page.");
      return;
    }

    setIsGenerating(true);
    setGenerationError("");
    setGenerationNotice("");

    let currentJob;
    if (retryTargetJobId) {
      try {
        currentJob = retryJob(retryTargetJobId);
      } catch (err) {
        setGenerationError(err instanceof Error ? err.message : "Retry failed");
        setIsGenerating(false);
        return;
      }
    } else {
      const isRefinement = Boolean(selectedImage);
      currentJob = registerJob({
        type: isRefinement ? "refinement" : "generation",
        projectId: project.id,
        pageId: page.id,
        revision: page.creation.revision ?? 1,
        prompt: page.creation.prompt.editedPrompt ?? page.creation.prompt.automaticPrompt,
        aspectRatio: page.creation.settings.aspectRatio,
        optionCount,
        parentVersionId: selectedImage?.id ?? null,
      });
    }

    setActiveJobId(currentJob.id);
    const controller = new AbortController();
    startJob(currentJob.id, controller);

    try {
      const response = await fetch("/api/page-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          pageId: page.id,
          prompt: currentJob.prompt,
          aspectRatio: currentJob.aspectRatio,
          optionCount: currentJob.optionCount,
          parentVersionId: currentJob.parentVersionId,
          jobId: currentJob.id,
          revision: currentJob.revision,
        }),
      });

      const result = (await response.json()) as {
        versions?: ImageVersion[];
        error?: string;
        notice?: string;
        jobId?: string;
        revision?: number;
      };

      if (!response.ok || !result.versions?.length) {
        throw new Error(result.error || "Image generation failed. Please try again.");
      }

      // Stale response / Project-page isolation validation
      const validation = validateJobCompletion(
        currentJob,
        project.id,
        page.id,
        page.creation.revision ?? 1,
      );

      if (!validation.valid) {
        setGenerationNotice(
          validation.reason ?? "Generation completed, but response was stale or discarded.",
        );
        return;
      }

      completeJob(currentJob.id, result.versions.map((v) => v.id));
      onSaveImages(result.versions);
      setGenerationNotice(
        result.notice ?? (currentJob.type === "refinement" ? "Refined artwork generated." : "Image options generated."),
      );
      setLastFailedJobId(null);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setGenerationNotice("Image generation cancelled.");
      } else {
        const message =
          error instanceof Error ? error.message : "Image generation failed. Please try again.";
        failJob(currentJob.id, message);
        setGenerationError(message);
        setLastFailedJobId(currentJob.id);
      }
    } finally {
      setIsGenerating(false);
      setActiveJobId(null);
    }
  }

  function handleCancel() {
    if (activeJobId) {
      cancelJob(activeJobId, "Cancelled by user");
      setActiveJobId(null);
      setIsGenerating(false);
      setGenerationNotice("Image generation cancelled.");
    }
  }

  function handleRetry() {
    if (lastFailedJobId) {
      generateImages(lastFailedJobId);
    }
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-[900px] pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-[#777269] hover:text-[#393a36]">
          <span className="rotate-180"><Icon name="chevron" size={14} /></span>
          All approved pages
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onNavigate("previous")} disabled={pageIndex <= 0} className="rounded-lg border border-[#625b50]/12 bg-white/40 px-3 py-2 text-[9px] font-semibold text-[#5f5b54] disabled:cursor-not-allowed disabled:opacity-35">
            Previous
          </button>
          <span className="min-w-16 text-center text-[8px] font-bold uppercase tracking-[0.13em] text-[#888178]">
            {pageIndex + 1} / {pages.length}
          </span>
          <button type="button" onClick={() => onNavigate("next")} disabled={pageIndex >= pages.length - 1} className="rounded-lg border border-[#625b50]/12 bg-white/40 px-3 py-2 text-[9px] font-semibold text-[#5f5b54] disabled:cursor-not-allowed disabled:opacity-35">
            Next
          </button>
        </div>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,.8fr)]">
        <div className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-2xl border border-white/65 bg-[#f7f2ea]/90 p-4 shadow-[0_18px_50px_rgba(75,67,58,.12)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#777fd7]">Page {page.order} · {getOutputTypeLabel(project.outputType)}</p>
                <h2 className="mt-1.5 truncate font-serif text-[23px] tracking-[-0.03em] text-[#292a27]">{page.title}</h2>
              </div>
              <span className="shrink-0 rounded-full bg-[#dce6d4] px-2.5 py-1.5 text-[7px] font-bold uppercase tracking-[0.11em] text-[#607251]">Prompt ready</span>
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold text-[#34342f]">
                  {selectedImage ? "Refine page artwork" : "Generate page artwork"}
                </p>
                <p className="mt-1 text-[8px] text-[#89837a]">
                  {selectedImage
                    ? "Generates new versions linked to your selected artwork."
                    : "Uses the saved illustration prompt and aspect ratio."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[8px] text-[#777269]">
                  Options
                  <select
                    aria-label="Image options to generate"
                    value={optionCount}
                    onChange={(event) => setOptionCount(Number(event.target.value))}
                    className="ml-1.5 rounded-lg border border-[#625b50]/15 bg-white/70 px-2 py-2 text-[9px] text-[#3e3b35]"
                  >
                    {[1, 2, 3].map((count) => <option key={count} value={count}>{count}</option>)}
                  </select>
                </label>
                {isGenerating && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#a45143]/30 bg-[#a45143]/10 px-2.5 py-2 text-[9px] font-semibold text-[#8c4338] hover:bg-[#a45143]/20"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => generateImages()}
                  disabled={isGenerating || !page.creation.prompt.automaticPrompt.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#282927] px-3 py-2.5 text-[9px] font-semibold text-white hover:bg-[#3a3b38] disabled:cursor-wait disabled:opacity-55"
                >
                  <Icon name="sparkles" size={13} />
                  {isGenerating
                    ? "Generating..."
                    : selectedImage
                      ? "Refine illustration"
                      : "Generate illustration"}
                </button>
              </div>
            </div>
            {generationError && (
              <div
                role="alert"
                className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-[#a45143]/20 bg-[#a45143]/[0.06] px-3 py-2 text-[9px] leading-relaxed text-[#8c4338]"
              >
                <span>{generationError}</span>
                {lastFailedJobId && (() => {
                  const job = getJob(lastFailedJobId);
                  const canRetry = job && job.retryCount < job.maxRetries;
                  return canRetry ? (
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={isGenerating}
                      className="shrink-0 rounded bg-[#8c4338] px-2 py-1 text-[8px] font-semibold text-white hover:bg-[#73352c]"
                    >
                      Retry ({job.retryCount}/{job.maxRetries})
                    </button>
                  ) : null;
                })()}
              </div>
            )}
            {generationNotice && (
              <p role="status" className="mt-2 rounded-lg border border-[#657053]/20 bg-[#657053]/[0.06] px-3 py-2 text-[9px] leading-relaxed text-[#526043]">
                {generationNotice}
              </p>
            )}

            <div className="mt-4 grid place-items-center rounded-xl bg-[#20211f] p-5 sm:p-7">
              <div className={`relative grid max-h-[440px] w-full max-w-[360px] place-items-center overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(124,131,218,.16),transparent_45%),linear-gradient(145deg,#292a27,#171816)] ${aspectClass}`}>
                {selectedImage ? (
                  <Image
                    src={selectedImage.imageUrl}
                    alt={`Generated artwork for page ${page.order}: ${page.title}`}
                    fill
                    unoptimized
                    sizes="(max-width: 760px) 90vw, 360px"
                    className="object-contain"
                  />
                ) : (
                  <div className="px-6 text-center">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[#8b8fce]"><Icon name="sparkles" size={18} /></div>
                    <p className="mt-3 text-[10px] font-semibold text-[#d5d4cf]">No illustration yet</p>
                    <p className="mt-1.5 text-[8px] leading-relaxed text-[#a6a59f]">Generate an image from this page’s saved prompt to see it here.</p>
                  </div>
                )}
              </div>
            </div>

            {page.creation.imageVersions.length > 0 && (
              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className={labelClass}>Generated options</span>
                  <span className="text-[8px] text-[#89837a]">Select an image to keep as this page’s current choice.</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {page.creation.imageVersions.map((version, index) => (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => onSelectImage(version.id)}
                      aria-pressed={version.selected}
                      aria-label={`Select generated option ${index + 1}`}
                      className={`relative aspect-[3/4] overflow-hidden rounded-lg border-2 bg-[#20211f] ${version.selected ? "border-[#777fd7]" : "border-transparent hover:border-[#777fd7]/45"}`}
                    >
                      <Image
                        src={version.imageUrl}
                        alt={`Generated option ${index + 1} for ${page.title}`}
                        fill
                        unoptimized
                        sizes="(max-width: 760px) 40vw, 150px"
                        className="object-cover"
                      />
                      {version.parentVersionId && (
                        <span className="absolute top-1.5 left-1.5 rounded bg-[#777fd7]/90 px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-wide text-white">
                          Refined
                        </span>
                      )}
                      {version.selected && (
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-[#282927]/85 px-2 py-1 text-[7px] font-bold uppercase tracking-wide text-white">
                          Selected
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-3 text-[9px] sm:grid-cols-2">
              <div><span className={labelClass}>Scene</span><p className="mt-1.5 leading-relaxed text-[#625e57]">{page.description}</p></div>
              <div><span className={labelClass}>Visual direction</span><p className="mt-1.5 leading-relaxed text-[#625e57]">{page.visualDirection}</p></div>
              <div><span className={labelClass}>Narration</span><p className="mt-1.5 leading-relaxed text-[#625e57]">{page.narration || "No narration saved."}</p></div>
              <div><span className={labelClass}>Dialogue</span><p className="mt-1.5 leading-relaxed text-[#625e57]">{page.dialogue || "No dialogue saved."}</p></div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-[#625b50]/10 bg-[#f7f2ea]/90 p-4 shadow-[0_10px_30px_rgba(75,67,58,.07)]">
          <h3 className="text-[11px] font-semibold text-[#34342f]">Creative settings</h3>
          <p className="mt-1 text-[9px] leading-relaxed text-[#89837a]">Tune the page without changing its approved story beat.</p>
          <div className="mt-4 grid gap-3">
            <label><span className={labelClass}>Camera angle</span><select value={page.creation.settings.cameraAngle} onChange={(event) => onUpdateSettings({ cameraAngle: event.target.value })} className={fieldClass}>{["Eye level", "Low angle", "High angle", "Overhead", "Dutch angle", "Close perspective"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className={labelClass}>Shot type</span><select value={page.creation.settings.shotType} onChange={(event) => onUpdateSettings({ shotType: event.target.value })} className={fieldClass}>{["Wide shot", "Medium shot", "Close-up", "Extreme close-up", "Full shot"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className={labelClass}>Lighting</span><select value={page.creation.settings.lighting} onChange={(event) => onUpdateSettings({ lighting: event.target.value })} className={fieldClass}>{["Natural soft light", "Dramatic contrast", "Golden hour", "Moonlit", "Diffused studio", "Backlit silhouette"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className={labelClass}>Composition</span><textarea value={page.creation.settings.composition} onChange={(event) => onUpdateSettings({ composition: event.target.value })} className={`${fieldClass} resize-none`} rows={2} /></label>
            <label><span className={labelClass}>Emotional tone</span><input value={page.creation.settings.emotionalTone} onChange={(event) => onUpdateSettings({ emotionalTone: event.target.value })} className={fieldClass} /></label>
            <label><span className={labelClass}>Additional instructions</span><textarea value={page.creation.settings.additionalInstructions} onChange={(event) => onUpdateSettings({ additionalInstructions: event.target.value })} className={`${fieldClass} resize-none`} rows={3} placeholder="Page-specific must-haves or boundaries" /></label>
            <fieldset>
              <legend className={labelClass}>Aspect ratio</legend>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {(["3:4", "16:9", "1:1"] as const).map((ratio) => (
                  <button key={ratio} type="button" onClick={() => onUpdateSettings({ aspectRatio: ratio })} className={`rounded-lg px-2 py-2 text-[9px] font-semibold ${page.creation.settings.aspectRatio === ratio ? "bg-[#777fd7] text-white" : "border border-[#625b50]/12 bg-white/45 text-[#6d6860]"}`}>{ratio}</button>
                ))}
              </div>
            </fieldset>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <PromptEditor key={`${page.id}-prompt`} page={page} onSave={onSavePrompt} onReset={onResetPrompt} />
        <ReferenceLibrary key={`${page.id}-references`} page={page} onAdd={onAddReference} onRemove={onRemoveReference} />
      </div>
    </div>
  );
}
