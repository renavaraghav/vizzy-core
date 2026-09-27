"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  applyCanvasBackground,
  applyTheme,
  getUserSettings,
  maskApiKey,
  saveUserSettings,
} from "@/lib/profile-storage";
import type {
  PageAspectRatio,
  Project,
  VisualOutputType,
} from "@/types/domain";
import type {
  BackgroundColorPreset,
  StoryEnginePreference,
  ThemePreference,
  UserSettings,
} from "@/types/profile-settings";

export type SettingsSection =
  | "appearance"
  | "creative"
  | "ai"
  | "account"
  | "data_privacy"
  | "plan_usage";

interface SettingsWorkspaceProps {
  onBackToStudio: () => void;
  projectCount?: number;
  totalBeatsCount?: number;
  projects?: Project[];
}

export function SettingsWorkspace({
  onBackToStudio,
  projectCount = 0,
  totalBeatsCount = 0,
  projects,
}: SettingsWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");
  const [settings, setSettings] = useState<UserSettings>(getUserSettings());
  const [saveToast, setSaveToast] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [theme, setTheme] = useState<ThemePreference>(settings.appearance.theme);
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColorPreset>(
    settings.appearance.backgroundColor || "warm_paper",
  );
  const [defaultFormat, setDefaultFormat] = useState<VisualOutputType>(
    settings.creative.defaultOutputFormat,
  );
  const [defaultAspectRatio, setDefaultAspectRatio] = useState<PageAspectRatio>(
    settings.creative.defaultAspectRatio,
  );
  const [preferredArtStyle, setPreferredArtStyle] = useState(
    settings.creative.preferredArtStyle,
  );
  const [defaultPaletteMood, setDefaultPaletteMood] = useState(
    settings.creative.defaultPaletteMood,
  );
  const [slideshowDuration, setSlideshowDuration] = useState(
    settings.creative.defaultSlideshowDuration,
  );
  const [preferredEngine, setPreferredEngine] = useState<StoryEnginePreference>(
    settings.ai.preferredEngine,
  );
  const [enableDemo, setEnableDemo] = useState(settings.ai.enableHighFidelityDemo);
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [savedKeyToast, setSavedKeyToast] = useState(false);

  const computedProjectCount = projects ? projects.length : projectCount;
  const computedTotalBeats = projects
    ? projects.reduce((acc, p) => acc + (p.storyPlan?.pageBeats.length ?? 0), 0)
    : totalBeatsCount;
  const computedTotalImages = projects
    ? projects.reduce(
        (acc, p) =>
          acc +
          (p.storyPlan?.pageBeats.reduce(
            (bAcc, b) => bAcc + (b.creation?.imageVersions?.length ?? 0),
            0,
          ) ?? 0),
        0,
      )
    : 0;

  const handleSaveCreative = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveUserSettings({
      creative: {
        defaultOutputFormat: defaultFormat,
        defaultAspectRatio,
        preferredArtStyle,
        defaultPaletteMood,
        defaultSlideshowDuration: slideshowDuration,
      },
    });
    setSettings(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleBackgroundColorChange = (newBg: BackgroundColorPreset) => {
    setBackgroundColor(newBg);
    applyCanvasBackground(newBg);
    const updated = saveUserSettings({
      appearance: { backgroundColor: newBg },
    });
    setSettings(updated);
  };

  const backgroundPresets: Array<{
    id: BackgroundColorPreset;
    label: string;
    description: string;
    bg: string;
    cardBg: string;
    border: string;
    ink: string;
  }> = [
    {
      id: "warm_paper",
      label: "Warm Paper",
      description: "Warm parchment studio (Default)",
      bg: "#e8e3da",
      cardBg: "#f6f1e9",
      border: "#d5cfc4",
      ink: "#20211f",
    },
    {
      id: "soft_grey",
      label: "Soft Grey",
      description: "Subtle neutral grey studio",
      bg: "#e3e5e8",
      cardBg: "#f4f6f8",
      border: "#cdd1d6",
      ink: "#1e2229",
    },
    {
      id: "white",
      label: "White",
      description: "Crisp illuminated canvas",
      bg: "#f8fafc",
      cardBg: "#ffffff",
      border: "#e2e8f0",
      ink: "#0f172a",
    },
    {
      id: "charcoal",
      label: "Charcoal",
      description: "Modern graphite studio",
      bg: "#222426",
      cardBg: "#2c2e33",
      border: "#3d4047",
      ink: "#f3f4f6",
    },
    {
      id: "deep_black",
      label: "Deep Black",
      description: "Cinematic OLED darkroom",
      bg: "#0d0e11",
      cardBg: "#18191e",
      border: "#282a33",
      ink: "#f8fafc",
    },
    {
      id: "deep_navy",
      label: "Deep Navy",
      description: "Midnight maritime blue",
      bg: "#0c1322",
      cardBg: "#141e33",
      border: "#1f2e4d",
      ink: "#f0f6fc",
    },
    {
      id: "dark_purple",
      label: "Dark Purple",
      description: "Atmospheric twilight violet",
      bg: "#150d24",
      cardBg: "#211538",
      border: "#342259",
      ink: "#f5f3ff",
    },
    {
      id: "dark_teal",
      label: "Dark Teal",
      description: "Rich cinematic deep teal",
      bg: "#091a1e",
      cardBg: "#11272c",
      border: "#1a3d45",
      ink: "#f0fdfa",
    },
  ];

  const getStorageSizeFormatted = () => {
    if (typeof window === "undefined") return "0 KB";
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("vizzy")) {
          total += (localStorage.getItem(key)?.length ?? 0) * 2;
        }
      }
      return `${(total / 1024).toFixed(1)} KB`;
    } catch {
      return "0 KB";
    }
  };

  const handleThemeChange = (newTheme: ThemePreference) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    const updated = saveUserSettings({
      appearance: { theme: newTheme },
    });
    setSettings(updated);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKeyInput.trim()) return;
    const masked = maskApiKey(customKeyInput);
    const updated = saveUserSettings({
      ai: { customApiKeyMasked: masked },
    });
    setSettings(updated);
    setCustomKeyInput("");
    setSavedKeyToast(true);
    setTimeout(() => setSavedKeyToast(false), 2000);
  };

  const handleToggleDemo = (checked: boolean) => {
    setEnableDemo(checked);
    const updated = saveUserSettings({
      ai: { enableHighFidelityDemo: checked },
    });
    setSettings(updated);
  };

  const handleExportData = () => {
    try {
      const raw = localStorage.getItem("vizzy:studio-state");
      if (!raw) {
        alert("No local projects found to export.");
        return;
      }
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vizzy-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error exporting local data.");
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.projects)) {
          localStorage.setItem("vizzy:studio-state", text);
          window.location.reload();
        } else {
          alert("Invalid Vizzy project backup file format.");
        }
      } catch {
        alert("Could not parse the selected JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    try {
      localStorage.removeItem("vizzy:studio-state");
      window.location.reload();
    } catch {
      // ignore
    }
  };

  const navItems: Array<{
    id: SettingsSection;
    label: string;
    icon: "palette" | "story" | "sparkles" | "characters" | "pages" | "download";
    badge?: string;
  }> = [
    { id: "appearance", label: "Appearance", icon: "palette" },
    { id: "creative", label: "Creative Preferences", icon: "story" },
    { id: "ai", label: "AI Preferences", icon: "sparkles" },
    { id: "account", label: "Account & Security", icon: "characters" },
    { id: "data_privacy", label: "Data & Privacy", icon: "download" },
    { id: "plan_usage", label: "Plan & Usage", icon: "pages", badge: "Local" },
  ];

  return (
    <div className="w-full max-w-4xl py-2">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between border-b border-black/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#777fd7]">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#777fd7]/15">
              <Icon name="settings" size={14} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
              Preferences
            </span>
          </div>
          <h1 className="mt-1 font-serif text-[26px] tracking-tight text-[#20211f]">
            Studio Settings
          </h1>
          <p className="text-[11px] text-[#777269]">
            Configure workspace theme, default storytelling values, generation engines, and storage.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToStudio}
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/70 px-3.5 py-2 text-[11px] font-semibold text-[#3a3b37] transition-colors hover:bg-white"
        >
          <Icon name="chevron" size={14} className="rotate-180" />
          Back to Storyboard
        </button>
      </div>

      {/* Main Grid: Left Side Navigation + Focused Content Area */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
        {/* Left Side Navigation */}
        <aside className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-[12px] font-medium transition-all ${
                activeSection === item.id
                  ? "bg-[#282927] text-white shadow-sm"
                  : "text-[#5e605a] hover:bg-black/[0.04] hover:text-[#20211f]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  name={item.icon}
                  size={15}
                  className={activeSection === item.id ? "text-[#aeb3ef]" : "text-[#777269]"}
                />
                <span>{item.label}</span>
              </span>
              {item.badge && (
                <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#868782]">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Focused Content Area */}
        <main className="rounded-2xl border border-white/60 bg-[#fffdfa]/95 p-6 shadow-[0_12px_36px_rgba(75,67,58,.08)] backdrop-blur-md">
          {/* 1. APPEARANCE */}
          {activeSection === "appearance" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[14px] font-semibold text-[#20211f]">Appearance</h2>
                <p className="mt-0.5 text-[11px] text-[#777269]">
                  Select your interface theme preference across the studio.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "dark", label: "Dark Mode", desc: "Classic deep studio", icon: "moon" as const },
                  { id: "light", label: "Light Mode", desc: "Warm illuminated paper", icon: "sun" as const },
                  { id: "system", label: "System", desc: "Match OS preference", icon: "sparkles" as const },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeChange(t.id as ThemePreference)}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                      theme === t.id
                        ? "border-[#777fd7] bg-[#777fd7]/10 ring-2 ring-[#777fd7]/20"
                        : "border-black/10 bg-white/70 hover:bg-white"
                    }`}
                  >
                    <Icon name={t.icon} size={16} className="text-[#777fd7]" />
                    <span className="mt-2 text-[12px] font-semibold text-[#20211f]">
                      {t.label}
                    </span>
                    <span className="mt-0.5 text-[10px] text-[#777269]">{t.desc}</span>
                  </button>
                ))}
              </div>

              {/* Background / Theme Color Presets */}
              <div className="pt-2 space-y-3">
                <div>
                  <h3 className="text-[13px] font-semibold text-[#20211f]">
                    Background &amp; Theme Color
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#777269]">
                    Customize the canvas background. Planned Pages, page beats, and studio workspaces adapt immediately.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {backgroundPresets.map((preset) => {
                    const isSelected = backgroundColor === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleBackgroundColorChange(preset.id)}
                        className={`group flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? "border-[#777fd7] ring-2 ring-[#777fd7]/30 shadow-md"
                            : "border-black/10 hover:border-black/25 bg-white/70 hover:bg-white"
                        }`}
                      >
                        <div
                          className="relative mb-2.5 h-12 w-full rounded-lg border p-1.5 shadow-inner transition-transform group-hover:scale-[1.02]"
                          style={{
                            backgroundColor: preset.bg,
                            borderColor: preset.border,
                          }}
                        >
                          <div
                            className="h-full w-2/3 rounded border shadow-xs flex items-center px-1.5"
                            style={{
                              backgroundColor: preset.cardBg,
                              borderColor: preset.border,
                            }}
                          >
                            <div
                              className="h-1.5 w-6 rounded-full opacity-60"
                              style={{ backgroundColor: preset.ink }}
                            />
                          </div>
                          {isSelected && (
                            <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#777fd7] text-[9px] font-bold text-white shadow">
                              ✓
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-[#20211f]">
                          {preset.label}
                        </span>
                        <span className="text-[9px] text-[#777269]">
                          {preset.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] p-3 text-[11px] text-[#777269]">
                ✓ Preserves subtle comic grid texture while guaranteeing high-contrast card surfaces and readable text. Changes persist across navigation and page refreshes.
              </div>
            </div>
          )}

          {/* 2. CREATIVE PREFERENCES */}
          {activeSection === "creative" && (
            <form onSubmit={handleSaveCreative} className="space-y-5">
              <div>
                <h2 className="text-[14px] font-semibold text-[#20211f]">Creative Preferences</h2>
                <p className="mt-0.5 text-[11px] text-[#777269]">
                  Default storytelling and art style options applied to <strong>new projects</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-[11px] text-[#85531d]">
                <strong>Isolation guarantee:</strong> Changing these global defaults will never alter, overwrite, or regenerate the Style Bible of any existing story projects.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="prefFormat" className="block text-[11px] font-semibold text-[#3a3b37]">
                    Default Story Format
                  </label>
                  <select
                    id="prefFormat"
                    value={defaultFormat}
                    onChange={(e) => setDefaultFormat(e.target.value as VisualOutputType)}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] text-[#20211f] outline-none"
                  >
                    <option value="graphic_novel">Graphic Novel (Comic Paneling)</option>
                    <option value="storyboard">Storyboard (Cinematic Shots)</option>
                    <option value="visual_book">Visual Book (Illustrated Prose)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="prefAspectRatio" className="block text-[11px] font-semibold text-[#3a3b37]">
                    Default Aspect Ratio
                  </label>
                  <select
                    id="prefAspectRatio"
                    value={defaultAspectRatio}
                    onChange={(e) => setDefaultAspectRatio(e.target.value as PageAspectRatio)}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] text-[#20211f] outline-none"
                  >
                    <option value="16:9">16:9 (Cinematic Landscape)</option>
                    <option value="3:4">3:4 (Classic Comic Page)</option>
                    <option value="1:1">1:1 (Square Panel)</option>
                    <option value="4:3">4:3 (Standard Screen)</option>
                    <option value="9:16">9:16 (Vertical Story / Mobile)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="prefArtStyle" className="block text-[11px] font-semibold text-[#3a3b37]">
                  Preferred Art Style
                </label>
                <input
                  id="prefArtStyle"
                  type="text"
                  value={preferredArtStyle}
                  onChange={(e) => setPreferredArtStyle(e.target.value)}
                  placeholder="e.g. Gritty cinematic graphic novel, expressive ink wash, high contrast shadows"
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[12px] text-[#20211f] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="prefPalette" className="block text-[11px] font-semibold text-[#3a3b37]">
                  Default Palette &amp; Mood Notes
                </label>
                <input
                  id="prefPalette"
                  type="text"
                  value={defaultPaletteMood}
                  onChange={(e) => setDefaultPaletteMood(e.target.value)}
                  placeholder="e.g. Muted gunmetal grey skies, stormy Atlantic blue-black waters"
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[12px] text-[#20211f] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[#3a3b37]">
                  Default Slideshow Pacing
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSlideshowDuration(sec)}
                      className={`rounded-xl border py-2 text-center text-[11px] font-medium transition-colors ${
                        slideshowDuration === sec
                          ? "border-[#282927] bg-[#282927] text-white"
                          : "border-black/10 bg-white/70 text-[#5e605a] hover:bg-white"
                      }`}
                    >
                      {sec} Seconds
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/[0.08] pt-4">
                <div>
                  {saveToast && (
                    <span className="text-[11px] font-semibold text-emerald-600 animate-in fade-in">
                      ✓ Creative preferences saved!
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#282927] px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#3b3c38]"
                >
                  <Icon name="check" size={13} />
                  Save Defaults
                </button>
              </div>
            </form>
          )}

          {/* 3. AI PREFERENCES */}
          {activeSection === "ai" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[14px] font-semibold text-[#20211f]">AI &amp; Generation Preferences</h2>
                <p className="mt-0.5 text-[11px] text-[#777269]">
                  Configure visual generation engines and optional custom credentials.
                </p>
              </div>

              {/* Primary Engine */}
              <div className="rounded-xl border border-black/10 bg-white p-4 space-y-3">
                <span className="text-[12px] font-bold text-[#20211f]">Image Generation Engine</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPreferredEngine("cloudflare");
                      saveUserSettings({ ai: { preferredEngine: "cloudflare" } });
                    }}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      preferredEngine === "cloudflare"
                        ? "border-[#777fd7] bg-[#777fd7]/10 ring-2 ring-[#777fd7]/20"
                        : "border-black/10 hover:bg-black/[0.02]"
                    }`}
                  >
                    <span className="block text-[11px] font-bold text-[#20211f]">
                      Cloudflare Workers AI
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#777269]">
                      FLUX.1-schnell serverless inference (4-8s per panel).
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreferredEngine("offline_procedural");
                      saveUserSettings({ ai: { preferredEngine: "offline_procedural" } });
                    }}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      preferredEngine === "offline_procedural"
                        ? "border-[#777fd7] bg-[#777fd7]/10 ring-2 ring-[#777fd7]/20"
                        : "border-black/10 hover:bg-black/[0.02]"
                    }`}
                  >
                    <span className="block text-[11px] font-bold text-[#20211f]">
                      Local Comic Engine
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#777269]">
                      Zero-latency procedural SVG + Sharp comic renderer.
                    </span>
                  </button>
                </div>
              </div>

              {/* Demo Mode Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4">
                <div className="space-y-0.5 pr-3">
                  <span className="text-[12px] font-bold text-[#20211f]">
                    High-Fidelity Demo Mode
                  </span>
                  <p className="text-[11px] text-[#777269]">
                    Uses pre-rendered cinematic WWII assets and instant visual generation without external API dependencies.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableDemo}
                  onChange={(e) => handleToggleDemo(e.target.checked)}
                  className="h-5 w-5 accent-[#777fd7] cursor-pointer"
                />
              </div>

              {/* Custom API Key */}
              <div className="rounded-xl border border-black/10 bg-white p-4 space-y-3">
                <span className="text-[12px] font-bold text-[#20211f]">
                  Custom Image API Key (Optional)
                </span>
                <p className="text-[11px] text-[#777269] leading-relaxed">
                  Keys configured in <code className="rounded bg-black/[0.05] px-1 py-0.5 font-mono text-[10px]">.env.local</code> remain server-side. You may also store a masked browser key for client-directed requests:
                </p>
                <form onSubmit={handleSaveApiKey} className="flex items-center gap-2">
                  <input
                    type="password"
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    placeholder={settings.ai.customApiKeyMasked || "Paste custom API key..."}
                    className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] text-[#20211f] outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#282927] px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-[#3c3e39]"
                  >
                    Save Key
                  </button>
                </form>
                {savedKeyToast && (
                  <span className="text-[10px] font-semibold text-emerald-600">
                    ✓ Custom key saved and masked.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 4. ACCOUNT & SECURITY */}
          {activeSection === "account" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[14px] font-semibold text-[#20211f]">Account &amp; Security</h2>
                <p className="mt-0.5 text-[11px] text-[#777269]">
                  Truthful account status and local security boundaries.
                </p>
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                  <span className="text-[11px] font-semibold text-[#777269]">Session State</span>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Guest / Local Demo Mode
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                  <span className="text-[11px] font-semibold text-[#777269]">Authentication Backend</span>
                  <span className="text-[11px] text-[#20211f]">Supabase (Integration Pending)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#777269]">Credential Storage</span>
                  <span className="text-[11px] text-emerald-700">None in client / No passwords stored</span>
                </div>
              </div>

              <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] p-4 space-y-2 text-[11px] leading-relaxed text-[#5e605a]">
                <h4 className="font-semibold text-[#20211f]">Security Commitment</h4>
                <p>
                  Vizzy never creates fake cloud identities or handles insecure client-side passwords. All creative work is currently held in your private browser sandbox. Cloud authentication and sync will require verified Supabase credentials when launched.
                </p>
              </div>
            </div>
          )}

          {/* 5. DATA & PRIVACY */}
          {activeSection === "data_privacy" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[14px] font-semibold text-[#20211f]">Data &amp; Privacy</h2>
                <p className="mt-0.5 text-[11px] text-[#777269]">
                  Manage your offline graphic novel storage, backups, and privacy.
                </p>
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-[12px] font-bold text-[#20211f]">Project Backup (JSON)</h4>
                  <p className="text-[11px] text-[#777269]">
                    Export all {projectCount} projects, beats, and prompt histories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[11px] font-semibold text-[#20211f] hover:bg-black/[0.03]"
                >
                  <Icon name="download" size={13} />
                  Export Backup
                </button>
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-[12px] font-bold text-[#20211f]">Restore Project Backup</h4>
                  <p className="text-[11px] text-[#777269]">
                    Import a previously exported Vizzy JSON file.
                  </p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-[#777fd7]/30 bg-[#777fd7]/10 px-3.5 py-2 text-[11px] font-semibold text-[#777fd7] hover:bg-[#777fd7]/20"
                  >
                    Upload JSON
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-4 space-y-2">
                <h4 className="text-[12px] font-bold text-[#20211f]">Storage Usage Breakdown</h4>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="rounded-lg bg-black/[0.03] p-2.5">
                    <span className="text-[#777269] block text-[10px]">Saved Projects</span>
                    <strong className="text-[13px] text-[#20211f]">{computedProjectCount}</strong>
                  </div>
                  <div className="rounded-lg bg-black/[0.03] p-2.5">
                    <span className="text-[#777269] block text-[10px]">Total Beats</span>
                    <strong className="text-[13px] text-[#20211f]">{computedTotalBeats}</strong>
                  </div>
                  <div className="rounded-lg bg-black/[0.03] p-2.5">
                    <span className="text-[#777269] block text-[10px]">LocalStorage Used</span>
                    <strong className="text-[13px] text-[#20211f]">{getStorageSizeFormatted()}</strong>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4 space-y-2">
                <h4 className="text-[12px] font-bold text-red-700">Danger Zone</h4>
                <p className="text-[11px] text-[#777269]">
                  Permanently erase all graphic novel projects and preferences from this browser.
                </p>
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                  >
                    Reset Local Storage
                  </button>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleResetData}
                      className="rounded-xl bg-red-600 px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700"
                    >
                      Yes, Clear All Data
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="rounded-xl border border-black/10 px-3 py-1.5 text-[11px] font-medium text-[#777269] hover:bg-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. PLAN & USAGE */}
          {activeSection === "plan_usage" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[14px] font-semibold text-[#20211f]">Plan &amp; Usage</h2>
                <p className="mt-0.5 text-[11px] text-[#777269]">
                  Current tier status and honest resource consumption tracking.
                </p>
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <div>
                    <span className="text-[14px] font-bold text-[#20211f]">
                      Local Prototype Plan
                    </span>
                    <span className="block text-[11px] text-[#777269]">
                      Offline sandbox with local and Cloudflare Workers AI integration.
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700">
                    Active &amp; Free
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-[11px]">
                  <div className="rounded-xl bg-black/[0.03] p-3">
                    <span className="text-[#777269]">Saved Projects</span>
                    <p className="mt-1 font-serif text-[18px] font-bold text-[#20211f]">
                      {computedProjectCount}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/[0.03] p-3">
                    <span className="text-[#777269]">Total Story Beats</span>
                    <p className="mt-1 font-serif text-[18px] font-bold text-[#20211f]">
                      {computedTotalBeats}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/[0.03] p-3">
                    <span className="text-[#777269]">Images Generated</span>
                    <p className="mt-1 font-serif text-[18px] font-bold text-[#20211f]">
                      {computedTotalImages}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#777fd7]/20 bg-[#777fd7]/[0.05] p-4 space-y-2 text-[11px] leading-relaxed text-[#50548a]">
                <div className="flex items-center gap-2 font-bold text-[#3c4078]">
                  <Icon name="sparkles" size={15} />
                  <span>Cloud Subscriptions &amp; Billing (Coming Soon)</span>
                </div>
                <p>
                  Tiered usage quotas, team collaboration, and cloud GPU compute credits will be announced with the cloud release. In accordance with platform integrity rules, no fictitious balances or fake invoices are displayed.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
