"use client";

import Image from "next/image";
import { LogoMark } from "@/components/ui/logo-mark";
import type { ChatAction, ImageVersion } from "@/types/domain";

interface ChatMessageProps {
  content: string;
  role: "assistant" | "user";
  pageId?: string;
  imageOptions?: ImageVersion[];
  actions?: ChatAction[];
  onSelectOption?: (pageId: string, versionId: string) => void;
  onTriggerAction?: (action: ChatAction) => void;
}

export function ChatMessage({
  content,
  role,
  pageId,
  imageOptions,
  actions,
  onSelectOption,
  onTriggerAction,
}: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="ml-9 flex justify-end">
        <div className="max-w-[92%] rounded-2xl rounded-br-md bg-[#343632] px-4 py-3 text-[12px] leading-[1.65] text-[#deddd8]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <LogoMark size={27} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#a6a79f]">Vizzy</span>
          {pageId && (
            <span className="rounded bg-white/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#8b8fce]">
              Beat Visuals
            </span>
          )}
        </div>

        {/* Message prose with line breaks support */}
        <div className="text-[12px] leading-[1.7] text-[#c5c5bf] whitespace-pre-line">
          {content}
        </div>

        {/* In-Chat Image Options Grid */}
        {imageOptions && imageOptions.length > 0 && (
          <div className="mt-3.5 space-y-2 rounded-xl border border-white/10 bg-black/35 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#999]">
                Generated Visual Options ({imageOptions.length})
              </span>
              <span className="text-[8px] text-[#777]">Click an image to select</span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {imageOptions.map((opt, idx) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pageId && onSelectOption?.(pageId, opt.id)}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all ${
                    opt.selected
                      ? "border-[#777fd7] ring-2 ring-[#777fd7]/40 shadow-lg scale-[1.02]"
                      : "border-white/10 hover:border-white/40 hover:scale-[1.01]"
                  }`}
                  title={`Option ${idx + 1} - click to select`}
                >
                  <Image
                    src={opt.imageUrl}
                    alt={`Option ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-4">
                    <span
                      className={`block rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                        opt.selected
                          ? "bg-[#777fd7] text-white"
                          : "bg-black/60 text-[#bbb]"
                      }`}
                    >
                      {opt.selected ? "✓ Selected" : `Option ${idx + 1}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* In-Chat Action Buttons */}
        {actions && actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {actions.map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => onTriggerAction?.(act)}
                className={`rounded-lg px-2.5 py-1.5 text-[9px] font-semibold transition ${
                  act.action === "open_slideshow"
                    ? "bg-[#657053] text-white hover:bg-[#74805e] shadow-sm"
                    : act.action === "next_page"
                    ? "bg-[#777fd7] text-white hover:bg-[#868dde] shadow-sm"
                    : "border border-white/10 bg-white/5 text-[#d0cfcb] hover:bg-white/10 hover:text-white"
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
