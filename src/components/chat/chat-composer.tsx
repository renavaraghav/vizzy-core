"use client";

import { useRef, type FormEvent, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Describe your story, scene, or idea…",
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useAutoResizeTextarea(textareaRef, value);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="composer-shadow rounded-2xl bg-[#222320] p-2.5">
      <label htmlFor="story-prompt" className="sr-only">
        Describe your story
      </label>
      <textarea
        ref={textareaRef}
        id="story-prompt"
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="studio-scrollbar block min-h-[52px] w-full resize-none bg-transparent px-2.5 py-2 text-[12px] leading-[1.55] text-[#e7e5df] outline-none placeholder:text-[#60615c]"
      />
      <div className="mt-1 flex items-center justify-between">
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-lg text-[#7b7c76] transition-colors hover:bg-white/[0.05] hover:text-[#c4c4bd]"
          aria-label="Attach a file"
          title="Attachments coming soon"
        >
          <Icon name="plus" size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#555650] max-[1180px]:hidden">Enter to send</span>
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#858bdd] text-white shadow-[0_5px_16px_rgba(124,131,218,.2)] transition-all hover:bg-[#949ae5] disabled:cursor-default disabled:bg-[#353632] disabled:text-[#686963] disabled:shadow-none"
            aria-label="Send message"
          >
            <Icon name="send" size={15} />
          </button>
        </div>
      </div>
    </form>
  );
}
