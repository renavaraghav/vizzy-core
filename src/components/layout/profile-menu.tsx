"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { UserProfile } from "@/types/profile-settings";

interface ProfileMenuProps {
  isOpen: boolean;
  profile: UserProfile;
  projectCount: number;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export function ProfileMenu({
  isOpen,
  profile,
  projectCount,
  onClose,
  onOpenProfile,
  onOpenSettings,
}: ProfileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showSignInInfo, setShowSignInInfo] = useState(false);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={menuRef}
        role="menu"
        aria-label="Account and settings menu"
        className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl border border-white/10 bg-[#1b1c1a]/95 p-2 text-[#f5f3ef] shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150 z-50"
      >
        {/* Profile Card Header */}
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c83da] to-[#4e536f] text-[11px] font-bold text-white shadow-sm">
            {profile.avatarInitials}
          </span>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold text-white">
              {profile.displayName}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#868782]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Local Demo Guest
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="my-1.5 space-y-0.5">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenProfile();
              onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12px] font-medium text-[#deddd8] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Icon name="characters" size={15} className="text-[#aeb3ef]" />
            <span>Profile Experience</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12px] font-medium text-[#deddd8] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Icon name="settings" size={15} className="text-[#aeb3ef]" />
            <span>Settings &amp; Preferences</span>
          </button>
        </div>

        <div className="h-px bg-white/[0.06] my-1" />

        {/* Truthful Storage & Account Status */}
        <div className="px-2.5 py-2 text-[10px] text-[#73746f]">
          <div className="flex items-center justify-between font-medium text-[#8c8d88]">
            <span>Storage Status</span>
            <span className="text-emerald-400 font-mono">Offline Local</span>
          </div>
          <p className="mt-0.5 leading-tight text-[#63645f]">
            {projectCount} {projectCount === 1 ? "story" : "stories"} saved in browser storage.
          </p>
        </div>

        <div className="h-px bg-white/[0.06] my-1" />

        {/* Authentication Option */}
        <button
          type="button"
          role="menuitem"
          onClick={() => setShowSignInInfo(true)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[11px] font-medium text-[#868782] transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Icon name="key" size={14} className="text-[#63645f]" />
            <span>Cloud Sign In</span>
          </span>
          <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-[#8c8d88]">
            Soon
          </span>
        </button>
      </div>

      {/* Honest Cloud Sign-In Status Dialog */}
      {showSignInInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1b1c1a] p-5 text-[#f5f3ef] shadow-2xl">
            <div className="flex items-center gap-2.5 text-[#aeb3ef]">
              <Icon name="sparkles" size={18} />
              <h3 className="text-[13px] font-bold text-white">Cloud Authentication</h3>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#a0a19b]">
              Vizzy is currently operating in <strong>Local Demo Mode</strong>. Cloud authentication, multi-device synchronization, and cloud storage via Supabase are planned for a future release.
            </p>
            <p className="mt-2 text-[10px] leading-relaxed text-[#73746f]">
              All your graphic novel projects, style bibles, and generated beats are safely preserved in your browser&apos;s local storage.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSignInInfo(false);
                  onClose();
                }}
                className="rounded-xl bg-[#777fd7] px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#868ee3]"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
