"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import type { PageBeat, Project } from "@/types/domain";

interface SlideshowWorkspaceProps {
  project: Project;
  onBackToPages: () => void;
  onSelectPage: (pageBeatId: string) => void;
  onClose?: () => void;
}

export function SlideshowWorkspace({
  project,
  onBackToPages,
  onSelectPage,
  onClose,
}: SlideshowWorkspaceProps) {
  const pages: PageBeat[] = [...(project.storyPlan?.pageBeats ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [slideDuration, setSlideDuration] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vizzy:default-pacing");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return 4;
  });
  const [showCaptions, setShowCaptions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalPages = pages.length;
  const currentPage = pages[currentIndex] || pages[0];

  const selectedImage =
    currentPage?.creation.imageVersions.find((v) => v.selected) ||
    currentPage?.creation.imageVersions[0] ||
    null;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= totalPages - 1) {
        if (isLooping) return 0;
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [totalPages, isLooping]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  }, [totalPages]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying || totalPages <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, slideDuration * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, slideDuration, totalPages, goToNext]);

  const handleClose = useCallback(() => {
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
    (onClose ?? onBackToPages)();
  }, [onClose, onBackToPages]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        setIsPlaying((p) => !p);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrev();
      } else if (event.key === "f" || event.key === "F") {
        toggleFullscreen();
      } else if (event.key === "Escape") {
        if (typeof document !== "undefined" && !document.fullscreenElement) {
          handleClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, handleClose]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }

  // Export Slideshow as a downloadable WebM Video using HTML5 Canvas & MediaRecorder
  async function exportVideo() {
    if (totalPages === 0 || isExportingVideo) return;
    setIsExportingVideo(true);
    setExportProgress(0);

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExportingVideo(false);
      return;
    }

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.toLowerCase().replace(/\s+/g, "-")}-storyboard-loop.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExportingVideo(false);
      setExportProgress(100);
    };

    mediaRecorder.start();

    // Helper to draw a single page frame on canvas
    const drawPage = async (page: PageBeat, index: number) => {
      ctx.fillStyle = "#121312";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const imageVersion =
        page.creation.imageVersions.find((v) => v.selected) ||
        page.creation.imageVersions[0];

      if (imageVersion?.imageUrl) {
        try {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // continue even if an image fails
            img.src = imageVersion.imageUrl;
          });

          // Draw image centered keeping aspect ratio
          const scale = Math.min((canvas.width - 80) / img.width, (canvas.height - 140) / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const drawX = (canvas.width - drawW) / 2;
          const drawY = 40 + (canvas.height - 180 - drawH) / 2;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          // Panel border
          ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
          ctx.lineWidth = 3;
          ctx.strokeRect(drawX, drawY, drawW, drawH);
        } catch {
          // fallback placeholder
        }
      }

      // Title & Page badge
      ctx.fillStyle = "rgba(20, 20, 20, 0.85)";
      ctx.fillRect(40, 20, 320, 36);
      ctx.fillStyle = "#dce6d4";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`PAGE ${index + 1} OF ${totalPages} · ${page.title.toUpperCase()}`, 55, 43);

      // Narration banner at bottom
      const narrationText = page.narration || page.description;
      if (narrationText) {
        ctx.fillStyle = "rgba(247, 242, 234, 0.95)";
        ctx.fillRect(60, canvas.height - 110, canvas.width - 120, 75);
        ctx.strokeStyle = "#282927";
        ctx.lineWidth = 2;
        ctx.strokeRect(60, canvas.height - 110, canvas.width - 120, 75);

        ctx.fillStyle = "#292a27";
        ctx.font = "italic 16px serif";
        // Simple wrap
        ctx.fillText(narrationText.slice(0, 110) + (narrationText.length > 110 ? "…" : ""), 80, canvas.height - 80);

        if (page.dialogue) {
          ctx.fillStyle = "#777fd7";
          ctx.font = "bold 13px sans-serif";
          ctx.fillText(`"${page.dialogue.slice(0, 100)}"`, 80, canvas.height - 50);
        }
      }
    };

    // Play through each page in video
    const frameSeconds = Math.max(slideDuration, 2);
    for (let i = 0; i < totalPages; i++) {
      setExportProgress(Math.round(((i + 1) / totalPages) * 100));
      await drawPage(pages[i], i);
      await new Promise((r) => setTimeout(r, frameSeconds * 1000));
    }

    mediaRecorder.stop();
  }

  if (totalPages === 0) {
    return (
      <div className="relative z-10 mx-auto w-full max-w-[500px] rounded-2xl border border-white/65 bg-[#fbf8f2]/90 p-8 text-center shadow-[0_18px_50px_rgba(75,67,58,.13)]">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-lg border border-black/10 bg-black/5 text-[#777] hover:bg-black/10 hover:text-black transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-black/20"
          title="Close slideshow"
          aria-label="Close slideshow"
        >
          <Icon name="close" size={14} />
        </button>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#282927] text-white">
          <Icon name="slideshow" size={24} />
        </div>
        <h2 className="mt-4 font-serif text-[24px] text-[#292a27]">No pages in this story yet</h2>
        <p className="mt-2 text-[11px] text-[#777269]">
          Create and approve story beats to watch them run in this slideshow loop.
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="mt-5 rounded-xl bg-[#282927] px-4 py-2 text-[10px] font-semibold text-white"
        >
          Return to story
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative z-10 flex h-full w-full flex-col bg-[#121312] text-white transition-all ${
        isFullscreen ? "fixed inset-0 z-50 p-6" : "rounded-2xl border border-white/10 p-4 sm:p-6"
      }`}
    >
      {/* Top Bar Navigation */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToPages}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium text-[#c5c4bf] hover:bg-white/10 hover:text-white"
          >
            <span className="rotate-180">
              <Icon name="chevron" size={14} />
            </span>
            Editor
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-[#777fd7]/25 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#9ba2ec]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#777fd7]" />
                Slideshow Loop
              </span>
              <h1 className="font-serif text-[18px] font-semibold tracking-[-0.01em] text-[#f2efe9]">
                {project.title}
              </h1>
            </div>
            <p className="mt-0.5 text-[9px] text-[#8e8d89]">
              Page {currentIndex + 1} of {totalPages} · {currentPage.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Caption visibility toggle */}
          <button
            type="button"
            onClick={() => setShowCaptions((s) => !s)}
            className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-semibold transition ${
              showCaptions
                ? "border-[#777fd7]/50 bg-[#777fd7]/20 text-[#a8aff4]"
                : "border-white/10 bg-white/5 text-[#888]"
            }`}
            title="Toggle graphic novel captions and dialogue"
          >
            Captions {showCaptions ? "ON" : "OFF"}
          </button>

          {/* Export Video button */}
          <button
            type="button"
            onClick={exportVideo}
            disabled={isExportingVideo}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2b2d29] border border-white/15 px-3 py-1.5 text-[9px] font-semibold text-[#e0ded8] hover:bg-[#383a34] disabled:opacity-50"
            title="Export complete slideshow as WebM video file"
          >
            <Icon name="download" size={13} />
            {isExportingVideo ? `Exporting (${exportProgress}%)` : "Export Video"}
          </button>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-[#888] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Toggle fullscreen (F)"
          >
            <Icon name="more" size={14} />
          </button>

          {/* Close Slideshow button */}
          <button
            type="button"
            onClick={handleClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#888] hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20"
            title="Close slideshow"
            aria-label="Close slideshow"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      </header>

      {/* Main Slideshow Stage */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden py-4">
        {/* The Graphic Novel Panel Frame */}
        <div className="relative flex max-h-[70vh] w-full max-w-[940px] flex-col items-center justify-center">
          <div className="relative aspect-video max-h-[580px] w-full overflow-hidden rounded-xl border-2 border-white/15 bg-[#181917] shadow-[0_24px_70px_rgba(0,0,0,0.8)]">
            {selectedImage ? (
              <Image
                src={selectedImage.imageUrl}
                alt={currentPage.title}
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 940px"
                className="object-contain transition-opacity duration-500"
                priority
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_center,rgba(119,127,215,0.08),transparent_70%)]">
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-[#888]">
                  <Icon name="sparkles" size={22} />
                </div>
                <h3 className="mt-4 font-serif text-[20px] text-[#ddd]">
                  {currentPage.title}
                </h3>
                <p className="mt-2 max-w-[500px] text-[10px] leading-relaxed text-[#999]">
                  {currentPage.visualDirection || currentPage.description}
                </p>
                <button
                  type="button"
                  onClick={() => onSelectPage(currentPage.id)}
                  className="mt-5 rounded-lg bg-[#777fd7] px-3.5 py-1.5 text-[9px] font-semibold text-white hover:bg-[#686fca]"
                >
                  Generate illustration in Editor
                </button>
              </div>
            )}

            {/* Act / Section Tag Badge */}
            {currentPage.optionalActLabel && (
              <div className="absolute left-4 top-4 rounded bg-black/75 px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-[#e6b980] border border-white/10 backdrop-blur-sm">
                {currentPage.optionalActLabel}
              </div>
            )}

            {/* Graphic Novel Caption & Dialogue Overlays */}
            {showCaptions && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <div className="mx-auto max-w-[800px] space-y-2">
                  {/* Narration Box (Classic Graphic Novel styled caption) */}
                  {(currentPage.narration || currentPage.description) && (
                    <div className="inline-block rounded-md border-2 border-[#3b352b] bg-[#fbf6ec]/95 px-4 py-2 shadow-lg backdrop-blur-sm">
                      <p className="font-serif text-[11px] font-medium italic leading-relaxed text-[#2a2723]">
                        {currentPage.narration || currentPage.description}
                      </p>
                    </div>
                  )}

                  {/* Dialogue Balloon */}
                  {currentPage.dialogue && (
                    <div className="flex items-center gap-2">
                      <div className="rounded-2xl border-2 border-white/30 bg-[#1c1d1a]/90 px-4 py-2 shadow-lg">
                        <p className="text-[11px] font-semibold leading-relaxed text-[#f3f1ec]">
                          “{currentPage.dialogue}”
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Previous / Next Arrow Clickers on sides */}
        <button
          type="button"
          onClick={goToPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/60 p-3 text-white transition hover:scale-110 hover:bg-black/90"
          aria-label="Previous slide"
        >
          <span className="rotate-180 block">
            <Icon name="chevron" size={18} />
          </span>
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/60 p-3 text-white transition hover:scale-110 hover:bg-black/90"
          aria-label="Next slide"
        >
          <Icon name="chevron" size={18} />
        </button>
      </main>

      {/* Bottom Playback & Scrubber Controls */}
      <footer className="shrink-0 space-y-3 border-t border-white/10 pt-4">
        {/* Animated Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#777fd7] to-[#9fa7f7] transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / totalPages) * 100}%`,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Main Controls: Play/Pause, Prev, Next, Loop */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black transition hover:scale-105 hover:bg-[#eee]"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              <Icon name={isPlaying ? "pause" : "play"} size={16} />
            </button>

            <button
              type="button"
              onClick={goToPrev}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#ccc] hover:bg-white/10 hover:text-white"
              title="Previous Page"
            >
              <span className="rotate-180 block">
                <Icon name="chevron" size={14} />
              </span>
            </button>

            <span className="px-2 text-[10px] font-semibold text-[#888]">
              {currentIndex + 1} / {totalPages}
            </span>

            <button
              type="button"
              onClick={goToNext}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#ccc] hover:bg-white/10 hover:text-white"
              title="Next Page"
            >
              <Icon name="chevron" size={14} />
            </button>

            {/* Loop Toggle */}
            <button
              type="button"
              onClick={() => setIsLooping((l) => !l)}
              className={`ml-2 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-wider transition ${
                isLooping
                  ? "border-[#777fd7]/50 bg-[#777fd7]/15 text-[#9fa7f7]"
                  : "border-white/10 bg-white/5 text-[#666]"
              }`}
              title="Toggle auto-looping playback"
            >
              <Icon name="refresh" size={11} />
              Loop: {isLooping ? "ON" : "OFF"}
            </button>
          </div>

          {/* Speed / Duration Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold text-[#777]">Pace:</span>
            {[2, 4, 6, 8].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSlideDuration(sec)}
                className={`rounded px-2 py-1 text-[8px] font-bold ${
                  slideDuration === sec
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/5 text-[#888] hover:text-white"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Jump-to-Page Thumbnail Strip */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {pages.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-7 min-w-7 rounded-md px-1.5 text-[9px] font-bold transition ${
                  idx === currentIndex
                    ? "bg-[#777fd7] text-white shadow-md"
                    : "border border-white/10 bg-white/5 text-[#888] hover:bg-white/10 hover:text-white"
                }`}
                title={`Jump to Page ${p.order}: ${p.title}`}
              >
                {p.order}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
