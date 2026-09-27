"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { getOutputTypeLabel } from "@/lib/onboarding";
import { MAX_PAGE_COUNT, MIN_PAGE_COUNT, validatePageCount } from "@/lib/story-planner";
import type { PageBeat, Project } from "@/types/domain";

interface StoryPlanningPanelProps {
  project: Project;
  onGenerate: (pageCount: number) => void;
  onSelectPage: (pageBeatId: string) => void;
  onUpdatePage: (
    pageBeatId: string,
    updates: Partial<
      Pick<
        PageBeat,
        "title" | "description" | "visualDirection" | "narration" | "dialogue" | "optionalActLabel"
      >
    >,
  ) => void;
  onAddPage: () => void;
  onDeletePage: (pageBeatId: string) => void;
  onMovePage: (pageBeatId: string, direction: "up" | "down") => void;
  onApprove: () => void;
  onViewPages: () => void;
  onEditDirection: () => void;
}

const COMMON_PAGE_COUNTS = [6, 8, 12, 16, 24];

interface EditorFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  rows?: number;
}

function EditorField({ label, value, placeholder, onChange, rows = 3 }: EditorFieldProps) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.14em] text-[#918b82]">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="studio-scrollbar block w-full resize-y rounded-xl border border-[#625c53]/12 bg-white/55 px-3 py-2.5 text-[10px] leading-[1.6] text-[#3d3b37] outline-none placeholder:text-[#aaa49b] focus:border-[#777fd7]/45 focus:ring-2 focus:ring-[#777fd7]/10"
      />
    </label>
  );
}

function PlanSetup({
  project,
  onGenerate,
  onEditDirection,
}: Pick<StoryPlanningPanelProps, "project" | "onGenerate" | "onEditDirection">) {
  const [pageCount, setPageCount] = useState(8);
  const isValid = validatePageCount(pageCount);
  const direction = [
    project.styleBible.artStyle,
    project.styleBible.mood,
    project.styleBible.palette,
  ].filter(Boolean);

  return (
    <div className="relative z-10 mx-auto w-full max-w-[720px] py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#777fd7]">
            <Icon name="pages" size={16} />
            <span className="text-[9px] font-bold uppercase tracking-[0.16em]">Story planning</span>
          </div>
          <h2 className="mt-2 font-serif text-[28px] tracking-[-0.035em] text-[#292a27]">
            Shape the page sequence
          </h2>
          <p className="mt-1.5 max-w-[560px] text-[10px] leading-relaxed text-[#777269]">
            Choose a starting length. Vizzy will make a deterministic suggested draft from your saved material—not an AI-generated final plan.
          </p>
        </div>
        <button
          type="button"
          onClick={onEditDirection}
          className="rounded-lg border border-[#5e594f]/15 bg-white/35 px-3 py-2 text-[9px] font-semibold text-[#625e57] hover:bg-white/60"
        >
          Edit creative direction
        </button>
      </div>

      <div className="artboard-shadow mt-6 rounded-2xl bg-[#f6f1e9]/95 p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-[1.4fr_.6fr]">
          <div>
            <div className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#918b82]">Saved story concept</div>
            <p className="mt-2 text-[11px] leading-[1.75] text-[#514e48]">{project.description}</p>
          </div>
          <div className="rounded-xl bg-[#e9e4db]/75 p-4">
            <div className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#918b82]">Creative context</div>
            <p className="mt-2 text-[10px] font-semibold text-[#4e4b45]">
              {getOutputTypeLabel(project.outputType)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {direction.length ? (
                direction.map((item) => (
                  <span key={item} className="max-w-full truncate rounded-full bg-white/55 px-2 py-1 text-[8px] text-[#706b63]">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-[9px] leading-relaxed text-[#8b857c]">No optional visual details yet.</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-[#655f56]/10 pt-5">
          <label htmlFor="page-count" className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#777269]">
            How many illustrated pages?
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {COMMON_PAGE_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setPageCount(count)}
                className={`h-9 min-w-10 rounded-lg px-3 text-[10px] font-semibold transition-colors ${
                  pageCount === count
                    ? "bg-[#777fd7] text-white"
                    : "border border-[#625c53]/12 bg-white/45 text-[#67635c] hover:bg-white/75"
                }`}
              >
                {count}
              </button>
            ))}
            <input
              id="page-count"
              type="number"
              min={MIN_PAGE_COUNT}
              max={MAX_PAGE_COUNT}
              value={pageCount}
              onChange={(event) => setPageCount(Number(event.target.value))}
              aria-describedby="page-count-help"
              className="h-9 w-24 rounded-lg border border-[#625c53]/12 bg-white/55 px-3 text-[10px] font-semibold text-[#4d4a44] outline-none focus:border-[#777fd7]/45"
            />
          </div>
          <p id="page-count-help" className={`mt-2 text-[9px] ${isValid ? "text-[#8b857c]" : "text-[#a95656]"}`}>
            {isValid
              ? `Start with ${pageCount} editable page ${pageCount === 1 ? "beat" : "beats"}. Maximum 30.`
              : "Enter a whole number from 1 to 30."}
          </p>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => onGenerate(pageCount)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#282927] px-4 py-2.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#3a3b38] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="sparkles" size={15} />
            Generate suggested draft
          </button>
        </div>
      </div>
    </div>
  );
}

function PageCard({
  page,
  index,
  pageCount,
  selected,
  onSelect,
  onUpdate,
  onDelete,
  onMove,
}: {
  page: PageBeat;
  index: number;
  pageCount: number;
  selected: boolean;
  onSelect: () => void;
  onUpdate: StoryPlanningPanelProps["onUpdatePage"];
  onDelete: () => void;
  onMove: StoryPlanningPanelProps["onMovePage"];
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-[#f6f1e9]/95 shadow-[0_9px_28px_rgba(75,67,58,.08)] transition-colors ${
        selected ? "border-[#777fd7]/45 ring-2 ring-[#777fd7]/10" : "border-white/65"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={onSelect}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#292a27] text-[11px] font-semibold text-white"
          aria-label={`Edit Page ${page.order}`}
        >
          {String(page.order).padStart(2, "0")}
        </button>
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#8d877e]">
              {page.optionalActLabel || "Unlabelled"}
            </span>
            {page.status === "approved" && (
              <span className="rounded-full bg-[#dce6d4] px-2 py-0.5 text-[7px] font-bold uppercase tracking-wide text-[#607251]">Approved</span>
            )}
          </div>
          <h3 className="mt-1 truncate text-[12px] font-semibold text-[#34342f]">{page.title || "Untitled page"}</h3>
          {!selected && (
            <p className="mt-1.5 line-clamp-2 text-[9px] leading-relaxed text-[#777269]">{page.description}</p>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(page.id, "up")}
            aria-label={`Move Page ${page.order} up`}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[#625c53]/10 bg-white/45 text-[12px] text-[#716d65] hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === pageCount - 1}
            onClick={() => onMove(page.id, "down")}
            aria-label={`Move Page ${page.order} down`}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[#625c53]/10 bg-white/45 text-[12px] text-[#716d65] hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↓
          </button>
        </div>
      </div>

      {selected && (
        <div className="border-t border-[#625c53]/10 bg-white/20 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.14em] text-[#918b82]">Page title</span>
              <input
                value={page.title}
                onChange={(event) => onUpdate(page.id, { title: event.target.value })}
                className="block h-10 w-full rounded-xl border border-[#625c53]/12 bg-white/55 px-3 text-[11px] font-semibold text-[#393833] outline-none focus:border-[#777fd7]/45 focus:ring-2 focus:ring-[#777fd7]/10"
              />
            </label>
            <div className="sm:col-span-2">
              <EditorField
                label="Scene description"
                value={page.description}
                placeholder="What happens and what changes on this page?"
                onChange={(description) => onUpdate(page.id, { description })}
                rows={4}
              />
            </div>
            <div className="sm:col-span-2">
              <EditorField
                label="Visual direction"
                value={page.visualDirection}
                placeholder="Composition, setting, subjects, and visual emphasis"
                onChange={(visualDirection) => onUpdate(page.id, { visualDirection })}
                rows={4}
              />
            </div>
            <EditorField
              label="Narration"
              value={page.narration}
              placeholder="Optional narration"
              onChange={(narration) => onUpdate(page.id, { narration })}
            />
            <EditorField
              label="Dialogue"
              value={page.dialogue}
              placeholder="Optional dialogue"
              onChange={(dialogue) => onUpdate(page.id, { dialogue })}
            />
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.14em] text-[#918b82]">Act or section label</span>
              <input
                value={page.optionalActLabel ?? ""}
                onChange={(event) => onUpdate(page.id, { optionalActLabel: event.target.value })}
                placeholder="e.g. Act I, Chapter 2, Sequence A"
                className="block h-10 w-full rounded-xl border border-[#625c53]/12 bg-white/55 px-3 text-[10px] text-[#393833] outline-none focus:border-[#777fd7]/45"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end border-t border-[#625c53]/10 pt-4">
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg px-3 py-2 text-[9px] font-semibold text-[#a05858] hover:bg-[#a05858]/10"
              aria-label={`Delete Page ${page.order}`}
            >
              Delete page
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export function StoryPlanningPanel({
  project,
  onGenerate,
  onSelectPage,
  onUpdatePage,
  onAddPage,
  onDeletePage,
  onMovePage,
  onApprove,
  onViewPages,
  onEditDirection,
}: StoryPlanningPanelProps) {
  const plan = project.storyPlan;
  if (!plan) {
    return <PlanSetup project={project} onGenerate={onGenerate} onEditDirection={onEditDirection} />;
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-[780px] py-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.13em] ${plan.status === "approved" ? "bg-[#dce6d4] text-[#607251]" : "bg-[#ded8cf] text-[#746f67]"}`}>
              {plan.status === "approved" ? "Approved plan" : "Suggested draft"}
            </span>
            <span className="text-[9px] text-[#8a857d]">{plan.pageBeats.length} pages</span>
          </div>
          <h2 className="mt-2 font-serif text-[27px] tracking-[-0.035em] text-[#292a27]">Editorial planning board</h2>
          <p className="mt-1.5 max-w-[570px] text-[10px] leading-relaxed text-[#777269]">
            Review the complete sequence. Select any card to edit it; every change is saved locally and an approved plan returns to draft.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddPage}
            disabled={plan.pageBeats.length >= MAX_PAGE_COUNT}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#5e594f]/15 bg-white/40 px-3 py-2 text-[9px] font-semibold text-[#5f5b54] hover:bg-white/70 disabled:opacity-40"
          >
            <Icon name="plus" size={13} /> Add page
          </button>
          {plan.status === "approved" ? (
            <button type="button" onClick={onViewPages} className="rounded-lg bg-[#657053] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#737e61]">
              View approved pages
            </button>
          ) : (
            <button
              type="button"
              onClick={onApprove}
              disabled={!plan.pageBeats.length}
              className="rounded-lg bg-[#282927] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#3a3b38] disabled:opacity-40"
            >
              Approve story plan
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/55 bg-white/30 px-4 py-3">
        <div className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#918b82]">Plan synopsis</div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-[#615d56]">{plan.synopsis}</p>
      </div>

      <div className="mt-5 space-y-3">
        {plan.pageBeats.length ? (
          plan.pageBeats.map((page, index) => (
            <PageCard
              key={page.id}
              page={page}
              index={index}
              pageCount={plan.pageBeats.length}
              selected={page.id === project.selectedPageBeatId}
              onSelect={() => onSelectPage(page.id)}
              onUpdate={onUpdatePage}
              onDelete={() => onDeletePage(page.id)}
              onMove={onMovePage}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#6b655c]/20 bg-white/25 p-8 text-center">
            <p className="text-[11px] font-semibold text-[#57544e]">This draft has no pages.</p>
            <p className="mt-1 text-[9px] text-[#8b857c]">Add a page to continue planning.</p>
            <button type="button" onClick={onAddPage} className="mt-4 rounded-lg bg-[#282927] px-3 py-2 text-[9px] font-semibold text-white">
              Add first page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
