"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessage } from "@/components/chat/chat-message";
import { Icon } from "@/components/ui/icon";
import { LogoMark } from "@/components/ui/logo-mark";
import type { StudioView } from "@/hooks/use-project-store";
import { ONBOARDING_STEP_ORDER, OPTIONAL_ONBOARDING_STEPS } from "@/lib/onboarding";
import {
  createAssistantMessage,
  createUserMessage,
  generatePageBeatDetails,
  parseConversationalIntent,
} from "@/lib/collaborative-director";
import {
  registerJob,
  startJob,
  completeJob,
  failJob,
  canStartJob,
  validateJobCompletion,
} from "@/lib/job-manager";
import type {
  ChatAction,
  ChatMessage as ChatMessageType,
  ImageVersion,
  OnboardingStep,
  PageBeat,
  PageCreativeSettings,
  Project,
} from "@/types/domain";

interface ChatPanelProps {
  project: Project | null;
  activeView: StudioView;
  onCreateProject: () => void;
  onSubmitAnswer: (answer: string) => void;
  onSelectView: (view: StudioView) => void;
  onGenerateStoryPlan: (pageCount: number) => void;
  onAddPage: () => void;
  onApproveStoryPlan: () => void;
  onAddPageInstruction: (pageBeatId: string, instruction: string) => void;
  onSelectPageBeat?: (pageBeatId: string) => void;
  onOpenPageCreation?: (pageBeatId: string) => void;
  onSavePageImages?: (pageBeatId: string, versions: ImageVersion[]) => void;
  onSelectPageImage?: (pageBeatId: string, versionId: string) => void;
  onUpdatePageCreativeSettings?: (
    pageBeatId: string,
    updates: Partial<PageCreativeSettings>,
  ) => void;
  onUpdatePage?: (
    pageBeatId: string,
    updates: Partial<
      Pick<
        PageBeat,
        "title" | "description" | "visualDirection" | "narration" | "dialogue" | "optionalActLabel"
      >
    >,
  ) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const QUICK_REPLIES: Partial<Record<OnboardingStep, string[]>> = {
  format: ["Graphic novel", "Storyboard", "Visual book"],
  art_style: ["Cinematic realism", "Gritty graphic novel", "Expressive ink wash"],
  palette: ["Muted olive & slate grey with fire bursts", "Noir monochrome", "Warm cinematic sunset"],
  mood: ["Tense, visceral & cinematic", "Intimate and heroic", "Atmospheric & gritty"],
};

export function ChatPanel({
  project,
  activeView,
  onCreateProject,
  onSubmitAnswer,
  onSelectView,
  onGenerateStoryPlan,
  onAddPage,
  onApproveStoryPlan,
  onAddPageInstruction,
  onSelectPageBeat,
  onOpenPageCreation,
  onSavePageImages,
  onSelectPageImage,
  onUpdatePageCreativeSettings,
  onUpdatePage,
  collapsed = false,
  onToggleCollapse,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isGeneratingArtwork, setIsGeneratingArtwork] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessageType[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isComplete = project?.onboarding.status === "complete";
  const currentStep = project?.onboarding.currentStep;
  const quickReplies = currentStep ? QUICK_REPLIES[currentStep] ?? [] : [];

  const pages = project?.storyPlan?.pageBeats ?? [];
  const selectedPage =
    pages.find((p) => p.id === project?.selectedPageBeatId) || pages[0] || null;

  // Combine project chat history with collaborative in-chat messages
  const baseMessages = project?.chatHistory ?? [];
  const allMessages = [...baseMessages, ...localMessages];
  const messageCount = allMessages.length;

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
  }, [messageCount, localMessages]);

  // Generate visual artwork options for a page and render them directly in chat
  const triggerImageGeneration = useCallback(
    async (pageToGenerate: PageBeat, customPrompt?: string) => {
      if (!project) return;
      if (!canStartJob(project.id, pageToGenerate.id)) {
        setLocalMessages((prev) => [
          ...prev,
          createAssistantMessage(
            `A visual generation task is already running for Page ${pageToGenerate.order}. Please wait for it to complete.`,
          ),
        ]);
        return;
      }

      setIsGeneratingArtwork(true);

      const promptText =
        customPrompt ||
        pageToGenerate.creation.prompt.editedPrompt ||
        pageToGenerate.creation.prompt.automaticPrompt ||
        `${project.styleBible.artStyle || "Cinematic graphic novel"}. ${pageToGenerate.visualDirection || pageToGenerate.description}`;

      const selectedVer =
        pageToGenerate.creation.imageVersions.find((v) => v.selected) ??
        pageToGenerate.creation.imageVersions[0] ??
        null;

      const job = registerJob({
        type: selectedVer ? "refinement" : "generation",
        projectId: project.id,
        pageId: pageToGenerate.id,
        revision: pageToGenerate.creation.revision ?? 1,
        prompt: promptText,
        aspectRatio: pageToGenerate.creation.settings.aspectRatio || "16:9",
        optionCount: 2,
        parentVersionId: selectedVer?.id ?? null,
      });

      const controller = new AbortController();
      startJob(job.id, controller);

      try {
        const response = await fetch("/api/page-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            pageId: pageToGenerate.id,
            prompt: promptText,
            aspectRatio: pageToGenerate.creation.settings.aspectRatio || "16:9",
            optionCount: 2,
            parentVersionId: job.parentVersionId,
            jobId: job.id,
            revision: job.revision,
          }),
        });

        const data = (await response.json()) as {
          versions?: ImageVersion[];
          error?: string;
          jobId?: string;
          revision?: number;
        };

        if (response.ok && data.versions && data.versions.length > 0) {
          const validation = validateJobCompletion(
            job,
            project.id,
            pageToGenerate.id,
            pageToGenerate.creation.revision ?? 1,
          );

          if (!validation.valid) {
            setLocalMessages((prev) => [
              ...prev,
              createAssistantMessage(
                `Generation finished, but was discarded (${validation.reason}).`,
              ),
            ]);
            return;
          }

          completeJob(job.id, data.versions.map((v) => v.id));
          onSavePageImages?.(pageToGenerate.id, data.versions);

          // Add assistant message with visual options inside the chat thread
          const msg = createAssistantMessage(
            `Here are 2 visual options for Page ${pageToGenerate.order}: "${pageToGenerate.title}".\n\nClick an option below to select it, or tell me in chat how to refine it (e.g. 'make it darker with more smoke').`,
            {
              pageId: pageToGenerate.id,
              imageOptions: data.versions,
              actions: [
                {
                  id: "act-opt-1",
                  label: "Select Option 1",
                  action: "select_option",
                  payload: { optionIndex: 0, pageId: pageToGenerate.id, versionId: data.versions[0].id },
                },
                {
                  id: "act-opt-2",
                  label: "Select Option 2",
                  action: "select_option",
                  payload: { optionIndex: 1, pageId: pageToGenerate.id, versionId: data.versions[1].id },
                },
                {
                  id: "act-next",
                  label: `Next Page (${pageToGenerate.order + 1}) →`,
                  action: "next_page",
                },
              ],
            },
          );
          setLocalMessages((prev) => [...prev, msg]);
        } else {
          failJob(job.id, data.error || "Unknown error");
          setLocalMessages((prev) => [
            ...prev,
            createAssistantMessage(
              `Note: Could not generate options for Page ${pageToGenerate.order}: ${data.error || "Unknown error"}. You can try again or describe the scene differently.`,
            ),
          ]);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // cancelled
        } else {
          const msg = err instanceof Error ? err.message : "Network error";
          failJob(job.id, msg);
          setLocalMessages((prev) => [
            ...prev,
            createAssistantMessage(
              "Encountered a network error generating image options. Please try again.",
            ),
          ]);
        }
      } finally {
        setIsGeneratingArtwork(false);
      }
    },
    [project, onSavePageImages],
  );

  // Handle in-chat option selection
  const handleSelectOption = useCallback(
    (pageId: string, versionId: string) => {
      onSelectPageImage?.(pageId, versionId);

      const targetPage = pages.find((p) => p.id === pageId);
      const pageNum = targetPage ? targetPage.order : 1;

      setLocalMessages((prev) => [
        ...prev,
        createAssistantMessage(
          `✓ Image selected for Page ${pageNum}! How does it look? You can ask for refinements (e.g., 'Make it darker with more rain'), say 'Next page' to continue your story, or watch the slideshow loop.`,
          {
            pageId,
            actions: [
              { id: "act-refine", label: "🖌 Refine this image", action: "refine_page" },
              { id: "act-next", label: `Next Page (${pageNum + 1}) →`, action: "next_page" },
              { id: "act-slideshow", label: "▶ Watch Slideshow Loop", action: "open_slideshow" },
            ],
          },
        ),
      ]);
    },
    [pages, onSelectPageImage],
  );

  // Move forward to next page beat collaboratively
  const handleNextPage = useCallback(() => {
    if (!project) return;

    // Ensure story plan exists
    if (!project.storyPlan || !project.storyPlan.pageBeats.length) {
      onGenerateStoryPlan(5);
      onApproveStoryPlan();
    }

    const currentOrder = selectedPage ? selectedPage.order : 0;
    const nextOrder = currentOrder + 1;
    let nextPage = pages.find((p) => p.order === nextOrder);

    if (!nextPage) {
      onAddPage();
      nextPage = pages.find((p) => p.order === nextOrder) || pages[pages.length - 1];
    }

    if (nextPage) {
      onSelectPageBeat?.(nextPage.id);
      onOpenPageCreation?.(nextPage.id);
    }

    // Synthesize rich dramatic beat
    const details = generatePageBeatDetails(project, currentOrder);
    if (nextPage) {
      onUpdatePage?.(nextPage.id, {
        title: details.title,
        description: details.description,
        visualDirection: details.visualDirection,
        narration: details.narration,
        dialogue: details.dialogue,
      });
      onUpdatePageCreativeSettings?.(nextPage.id, details.settings);
    }

    setLocalMessages((prev) => [
      ...prev,
      createAssistantMessage(
        `### Page ${nextOrder}: ${details.title}\n\n` +
          `**Narration:** *"${details.narration}"*\n` +
          `**Dialogue:** **${details.dialogue}**\n` +
          `**Visual Direction:** ${details.visualDirection}\n\n` +
          `What do you want for this page? Describe any adjustments or click below to generate visual options!`,
        {
          pageId: nextPage?.id,
          actions: [
            {
              id: `act-gen-${nextOrder}`,
              label: `✨ Generate Page ${nextOrder} Options`,
              action: "generate_options",
              payload: { pageId: nextPage?.id },
            },
            {
              id: `act-refine-${nextOrder}`,
              label: "🖌 Customize Dialogue & Framing",
              action: "refine_page",
            },
          ],
        },
      ),
    ]);
  }, [
    project,
    pages,
    selectedPage,
    onGenerateStoryPlan,
    onApproveStoryPlan,
    onAddPage,
    onSelectPageBeat,
    onOpenPageCreation,
    onUpdatePage,
    onUpdatePageCreativeSettings,
  ]);

  // Execute interactive chat actions
  const handleTriggerAction = useCallback(
    (action: ChatAction) => {
      if (action.action === "open_slideshow") {
        onSelectView("slideshow");
        setLocalMessages((prev) => [
          ...prev,
          createAssistantMessage("Opening the auto-running Graphic Novel Slideshow & Video Loop!"),
        ]);
      } else if (action.action === "next_page") {
        handleNextPage();
      } else if (action.action === "select_option" && action.payload) {
        const { pageId, versionId } = action.payload as { pageId: string; versionId: string };
        if (pageId && versionId) {
          handleSelectOption(pageId, versionId);
        }
      } else if (action.action === "generate_options") {
        const payload = action.payload as { pageId?: string } | undefined;
        const pageId = payload?.pageId;
        const targetPage: PageBeat | null =
          (pageId ? pages.find((p) => p.id === pageId) ?? null : null) ||
          selectedPage ||
          pages[0] ||
          null;
        if (targetPage) {
          triggerImageGeneration(targetPage);
        }
      } else if (action.action === "refine_page") {
        setLocalMessages((prev) => [
          ...prev,
          createAssistantMessage(
            "What would you like to refine? Type your changes (e.g. 'Add heavier rain and mortar explosions in background', or 'Change dialogue to something more urgent').",
          ),
        ]);
      }
    },
    [pages, selectedPage, onSelectView, handleNextPage, handleSelectOption, triggerImageGeneration],
  );

  // Submit message from the chat composer
  function submitMessage(answer = input) {
    const message = answer.trim();
    if (!message || !project) return;
    setInput("");

    // 1. Onboarding Phase
    if (!isComplete) {
      onSubmitAnswer(message);
      // If this completes onboarding, post a welcoming prompt for Page 1
      if (currentStep === "instructions") {
        setTimeout(() => {
          setLocalMessages((prev) => [
            ...prev,
            createAssistantMessage(
              `Creative direction established for **${project.title}**!\n\n` +
                `Now, let's create your graphic novel page by page. We'll collaborate on the dialogue, narration, and visuals for each page.\n\n` +
                `Click below to start Page 1, or tell me what happens in your opening scene!`,
              {
                actions: [
                  { id: "act-start-p1", label: "🎬 Start Page 1 Beats & Artwork", action: "next_page" },
                  { id: "act-plan", label: "View Story Plan Board", action: "custom", payload: { view: "planning" } },
                ],
              },
            ),
          ]);
        }, 300);
      }
      return;
    }

    // 2. Collaborative Page Creation Phase
    const intent = parseConversationalIntent(message);

    // Append the user's message to local chat stream
    setLocalMessages((prev) => [...prev, createUserMessage(message)]);

    // Handle intents
    if (intent.type === "play_slideshow") {
      onSelectView("slideshow");
      setLocalMessages((prev) => [
        ...prev,
        createAssistantMessage("Switching to full-bleed Slideshow Loop presentation mode!"),
      ]);
      return;
    }

    if (intent.type === "next_page") {
      handleNextPage();
      return;
    }

    if (intent.type === "select_option" && typeof intent.optionIndex === "number") {
      const pageToUse = selectedPage || pages[0];
      const version = pageToUse?.creation.imageVersions[intent.optionIndex];
      if (pageToUse && version) {
        handleSelectOption(pageToUse.id, version.id);
      } else {
        setLocalMessages((prev) => [
          ...prev,
          createAssistantMessage(
            `Option ${intent.optionIndex! + 1} not found. Please click on one of the option cards directly.`,
          ),
        ]);
      }
      return;
    }

    // Ensure we have a page to work on
    const activePage = selectedPage || pages[0];
    if (!activePage) {
      // If no page exists, generate initial plan and start Page 1
      onGenerateStoryPlan(5);
      onApproveStoryPlan();
      handleNextPage();
      return;
    }

    if (intent.type === "refine_image" || intent.type === "chat_general") {
      // Apply the user's refinement to this page
      onAddPageInstruction(activePage.id, message);
      onUpdatePageCreativeSettings?.(activePage.id, {
        additionalInstructions: message,
      });

      setLocalMessages((prev) => [
        ...prev,
        createAssistantMessage(
          `Refining Page ${activePage.order}: "${activePage.title}" with your instructions: "${message}". Generating new visual options now...`,
        ),
      ]);

      // Automatically regenerate visual options with updated instructions
      const combinedPrompt = `${activePage.creation.prompt.automaticPrompt}. Additional details: ${message}`;
      triggerImageGeneration(activePage, combinedPrompt);
      return;
    }

    if (intent.type === "generate_options") {
      triggerImageGeneration(activePage);
    }
  }

  const currentStepIndex = currentStep ? ONBOARDING_STEP_ORDER.indexOf(currentStep) : 0;
  const progress = Math.round((currentStepIndex / (ONBOARDING_STEP_ORDER.length - 1)) * 100);

  return (
    <aside
      className={`flex h-dvh min-h-[650px] flex-col bg-[#171816] max-[760px]:h-[46rem] transition-all duration-200 ease-in-out ${
        collapsed
          ? "w-0 min-w-0 max-w-0 opacity-0 pointer-events-none overflow-hidden border-l-0"
          : "w-full min-w-0 border-l border-white/[0.055] opacity-100"
      }`}
      aria-hidden={collapsed}
    >
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.055] px-5">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-[#eceae5]">Vizzy</h2>
            <span className="rounded-full bg-[#777fd7]/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#9ba2ec]">
              Creative Director
            </span>
          </div>
          <p className="mt-1 truncate text-[10px] text-[#8e8f8a]">
            {isComplete
              ? selectedPage
                ? `Page ${selectedPage.order} of ${pages.length} · ${selectedPage.title}`
                : "Collaborative Visual Studio"
              : `Creative Setup · ${progress}%`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isComplete && pages.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectView("slideshow")}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold text-[#c5c4bf] hover:bg-white/10 hover:text-white transition-colors"
              title="Open Slideshow Loop"
            >
              <Icon name="slideshow" size={13} />
              Loop
            </button>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="grid h-8 w-8 place-items-center rounded-lg text-[#777873] hover:bg-white/[0.08] hover:text-[#d5d4cf] transition-colors cursor-pointer"
              title="Collapse Creative Director"
              aria-label="Collapse Creative Director panel"
            >
              <Icon name="sidebar" size={16} className="rotate-180" />
            </button>
          )}
        </div>
      </header>

      {/* Messages Thread */}
      <div ref={scrollAreaRef} className="studio-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-6">
        {!project ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <LogoMark size={36} />
            <h3 className="mt-4 text-[13px] font-semibold text-[#deddd8]">Start a creative conversation</h3>
            <p className="mt-2 max-w-[240px] text-[10px] leading-[1.65] text-[#74756f]">
              Create a project and I’ll guide you through its story, aesthetic, and page-by-page visual development.
            </p>
            <button
              type="button"
              onClick={onCreateProject}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-[10px] font-semibold text-[#dad9d4] hover:bg-white/[0.08]"
            >
              <Icon name="plus" size={15} />
              New project
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {allMessages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                pageId={msg.pageId}
                imageOptions={msg.imageOptions}
                actions={msg.actions}
                onSelectOption={handleSelectOption}
                onTriggerAction={handleTriggerAction}
              />
            ))}

            {isGeneratingArtwork && (
              <div className="flex items-center gap-2 text-[10px] text-[#777fd7] animate-pulse">
                <Icon name="sparkles" size={14} />
                <span>Vizzy is painting artwork options for this beat...</span>
              </div>
            )}

            {/* Quick replies during onboarding */}
            {!isComplete && (quickReplies.length > 0 || (currentStep && OPTIONAL_ONBOARDING_STEPS.has(currentStep))) && (
              <div className="ml-10 border-l border-white/[0.07] pl-4">
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#555650]">
                  Suggestions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => submitMessage(reply)}
                      className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-[9px] text-[#92938d] hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-[#c7c7c0]"
                    >
                      {reply}
                    </button>
                  ))}
                  {currentStep && OPTIONAL_ONBOARDING_STEPS.has(currentStep) && (
                    <button
                      type="button"
                      onClick={() => submitMessage("Skip for now")}
                      className="rounded-full border border-dashed border-white/[0.09] px-2.5 py-1.5 text-[9px] text-[#6c6d67] hover:text-[#a8a9a2]"
                    >
                      Skip
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer Input Area - Always Enabled for interactive back-and-forth */}
      <div className="shrink-0 border-t border-white/[0.04] bg-[#171816] p-4 pt-3">
        <ChatComposer
          value={input}
          onChange={setInput}
          onSubmit={() => submitMessage()}
          disabled={!project || isGeneratingArtwork}
          placeholder={
            !project
              ? "Create a project to begin…"
              : isComplete
              ? selectedPage
                ? `What do you want for Page ${selectedPage.order}? (or refine / 'next page')`
                : "Describe your next scene beat or ask for options…"
              : "Type your answer or premise…"
          }
        />
        <div className="mt-2.5 flex items-center justify-between text-[8px] text-[#555650]">
          <span>Collaborative Storyboard Studio</span>
          <span>Try: &quot;Select Option 1&quot; · &quot;Make it rainier&quot; · &quot;Next page&quot;</span>
        </div>
      </div>
    </aside>
  );
}
