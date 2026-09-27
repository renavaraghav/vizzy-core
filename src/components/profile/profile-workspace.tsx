"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  getUserProfile,
  saveUserProfile,
} from "@/lib/profile-storage";
import type { UserProfile } from "@/types/profile-settings";
import type { VisualOutputType } from "@/types/domain";

interface ProfileWorkspaceProps {
  onBackToStudio: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
}

export function ProfileWorkspace({
  onBackToStudio,
  onProfileUpdated,
}: ProfileWorkspaceProps) {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [preferredFormat, setPreferredFormat] = useState<VisualOutputType>(
    profile.preferredStoryFormat,
  );
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveUserProfile({
      displayName,
      bio,
      preferredStoryFormat: preferredFormat,
    });
    setProfile(updated);
    onProfileUpdated?.(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleReset = () => {
    const current = getUserProfile();
    setDisplayName(current.displayName);
    setBio(current.bio);
    setPreferredFormat(current.preferredStoryFormat);
  };

  const formatOptions: Array<{
    id: VisualOutputType;
    title: string;
    description: string;
    icon: "story" | "pages" | "slideshow";
  }> = [
    {
      id: "graphic_novel",
      title: "Graphic Novel",
      description: "Dramatic comic panel pacing with dialogue balloons, narration boxes, and bold visuals.",
      icon: "story",
    },
    {
      id: "storyboard",
      title: "Storyboard",
      description: "Film and animation camera blocking, shot framing, lighting notes, and director directions.",
      icon: "pages",
    },
    {
      id: "visual_book",
      title: "Visual Book",
      description: "Illustrated narrative chapters with rich atmospheric prose and integrated artwork.",
      icon: "slideshow",
    },
  ];

  return (
    <div className="w-full max-w-2xl py-2">
      {/* Top Banner & Return */}
      <div className="mb-6 flex items-center justify-between border-b border-black/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#777fd7]">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#777fd7]/15">
              <Icon name="characters" size={14} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
              Creative Profile
            </span>
          </div>
          <h1 className="mt-1 font-serif text-[26px] tracking-tight text-[#20211f]">
            Creator Profile
          </h1>
          <p className="text-[11px] text-[#777269]">
            Manage your personal persona, creator identity, and default storytelling style.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToStudio}
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/70 px-3.5 py-2 text-[11px] font-semibold text-[#3a3b37] transition-colors hover:bg-white"
        >
          <Icon name="chevron" size={14} className="rotate-180" />
          Back to Studio
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar & Persona Card */}
        <div className="rounded-2xl border border-white/60 bg-[#fffdfa]/90 p-5 shadow-[0_12px_36px_rgba(75,67,58,.08)] backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#7c83da] to-[#4e536f] font-serif text-[22px] font-bold text-white shadow-md">
              {profile.avatarInitials}
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-[#20211f]">
                  {displayName || "Guest Creator"}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-700">
                  Local Demo Guest
                </span>
              </div>
              <p className="text-[11px] text-[#777269]">
                Preferences stored privately in your browser storage.
              </p>
            </div>
          </div>
        </div>

        {/* Identity Inputs */}
        <div className="rounded-2xl border border-white/60 bg-[#fffdfa]/90 p-5 shadow-[0_12px_36px_rgba(75,67,58,.08)] space-y-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#777269]">
            Creator Identity
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="displayName" className="block text-[11px] font-semibold text-[#3a3b37]">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Captain Miller"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[12px] text-[#20211f] outline-none transition-colors focus:border-[#777fd7] focus:ring-2 focus:ring-[#777fd7]/10"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="accountEmail" className="block text-[11px] font-semibold text-[#3a3b37]">
                Account Identity (Email)
              </label>
              <div className="relative">
                <input
                  id="accountEmail"
                  type="text"
                  readOnly
                  disabled
                  value="Guest Mode (Unauthenticated)"
                  className="w-full cursor-not-allowed rounded-xl border border-black/10 bg-black/[0.03] px-3.5 py-2 text-[12px] text-[#868782] outline-none"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-black/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-[#73746f]">
                  Read Only
                </span>
              </div>
              <p className="text-[10px] text-[#868782]">
                Authentication identity is derived from verified sessions. Cloud auth will appear here when Supabase is connected.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label htmlFor="creativeBio" className="block text-[11px] font-semibold text-[#3a3b37]">
              Creative Bio &amp; Artistic Background
            </label>
            <textarea
              id="creativeBio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell Vizzy about your favorite storytelling themes, writing influences, or genres..."
              className="w-full resize-none rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[12px] leading-relaxed text-[#20211f] outline-none transition-colors focus:border-[#777fd7] focus:ring-2 focus:ring-[#777fd7]/10"
            />
          </div>
        </div>

        {/* Preferred Storytelling Format */}
        <div className="rounded-2xl border border-white/60 bg-[#fffdfa]/90 p-5 shadow-[0_12px_36px_rgba(75,67,58,.08)] space-y-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#777269]">
            Preferred Storytelling Format
          </h2>
          <p className="text-[11px] text-[#777269]">
            Select your favorite format to pre-fill future creative projects:
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {formatOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreferredFormat(opt.id)}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                  preferredFormat === opt.id
                    ? "border-[#777fd7] bg-[#777fd7]/10 ring-2 ring-[#777fd7]/20"
                    : "border-black/10 bg-white/70 hover:bg-white"
                }`}
              >
                <span className="flex items-center gap-1.5 font-semibold text-[12px] text-[#20211f]">
                  <Icon name={opt.icon} size={15} className="text-[#777fd7]" />
                  {opt.title}
                </span>
                <span className="mt-1 text-[10px] leading-relaxed text-[#777269]">
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between border-t border-black/[0.08] pt-4">
          <div className="flex items-center gap-2">
            {savedFeedback && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 animate-in fade-in">
                <Icon name="check" size={14} /> Profile preferences saved!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-[11px] font-medium text-[#777269] transition-colors hover:bg-white hover:text-[#20211f]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#282927] px-5 py-2 text-[11px] font-semibold text-white shadow-md transition-colors hover:bg-[#3d3f3b]"
            >
              <Icon name="check" size={13} />
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
