import type { PageAspectRatio } from "@/types/domain";
import type {
  BackgroundColorPreset,
  ThemePreference,
  UserProfile,
  UserSettings,
} from "@/types/profile-settings";

const PROFILE_STORAGE_KEY = "vizzy:user-profile";
const SETTINGS_STORAGE_KEY = "vizzy:user-settings";
const PREFERENCES_EVENT = "vizzy:preferences-changed";

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: "guest-user",
  displayName: "Guest Creator",
  email: null,
  bio: "Visual novelist & comic creator experimenting with cinematic storytelling.",
  preferredStoryFormat: "graphic_novel",
  avatarInitials: "GC",
  isGuest: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  version: 1,
  appearance: {
    theme: "dark",
    backgroundColor: "warm_paper",
  },
  creative: {
    defaultOutputFormat: "graphic_novel",
    defaultAspectRatio: "16:9",
    preferredArtStyle: "Gritty cinematic graphic novel, expressive ink wash, high contrast shadows",
    defaultPaletteMood: "Visceral, tense, heroic, breathless claustrophobia",
    defaultSlideshowDuration: 4,
  },
  ai: {
    preferredEngine: "cloudflare",
    enableHighFidelityDemo: false,
    customApiKeyMasked: null,
  },
  dataPrivacy: {
    storageMode: "local_browser",
  },
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function deriveInitials(name: string): string {
  if (!name.trim()) return "GC";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase() || "GC";
}

export function maskApiKey(key?: string | null): string {
  if (!key) return "";
  const clean = key.trim();
  if (!clean) return "";
  if (clean.length <= 8) return "••••••••";
  return `${clean.slice(0, 8)}••••••••${clean.slice(-4)}`;
}

export function getUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (!parsed || typeof parsed !== "object") return DEFAULT_USER_PROFILE;

    return {
      id: "guest-user",
      displayName: typeof parsed.displayName === "string" && parsed.displayName.trim()
        ? parsed.displayName.trim()
        : DEFAULT_USER_PROFILE.displayName,
      email: null, // Always truthful guest email when unauthenticated
      bio: typeof parsed.bio === "string" ? parsed.bio : DEFAULT_USER_PROFILE.bio,
      preferredStoryFormat:
        parsed.preferredStoryFormat === "graphic_novel" ||
        parsed.preferredStoryFormat === "storyboard" ||
        parsed.preferredStoryFormat === "visual_book"
          ? parsed.preferredStoryFormat
          : DEFAULT_USER_PROFILE.preferredStoryFormat,
      avatarInitials: deriveInitials(parsed.displayName || DEFAULT_USER_PROFILE.displayName),
      isGuest: true,
      createdAt: parsed.createdAt || DEFAULT_USER_PROFILE.createdAt,
      updatedAt: parsed.updatedAt || DEFAULT_USER_PROFILE.updatedAt,
    };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveUserProfile(updates: Partial<UserProfile>): UserProfile {
  const current = getUserProfile();
  const now = new Date().toISOString();

  const nextDisplayName = updates.displayName !== undefined
    ? updates.displayName.trim() || DEFAULT_USER_PROFILE.displayName
    : current.displayName;

  const next: UserProfile = {
    ...current,
    displayName: nextDisplayName,
    bio: updates.bio !== undefined ? updates.bio : current.bio,
    preferredStoryFormat: updates.preferredStoryFormat || current.preferredStoryFormat,
    avatarInitials: deriveInitials(nextDisplayName),
    updatedAt: now,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(PREFERENCES_EVENT));
    } catch {
      // Storage unavailable fallback
    }
  }

  return next;
}

export function getUserSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_USER_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    if (!parsed || typeof parsed !== "object") return DEFAULT_USER_SETTINGS;

    const appearanceTheme: ThemePreference =
      parsed.appearance?.theme === "light" ||
      parsed.appearance?.theme === "dark" ||
      parsed.appearance?.theme === "system"
        ? parsed.appearance.theme
        : DEFAULT_USER_SETTINGS.appearance.theme;

    const validColors: BackgroundColorPreset[] = [
      "warm_paper",
      "soft_grey",
      "white",
      "charcoal",
      "deep_black",
      "deep_navy",
      "dark_purple",
      "dark_teal",
    ];
    const appearanceBg: BackgroundColorPreset =
      validColors.includes(parsed.appearance?.backgroundColor as BackgroundColorPreset)
        ? (parsed.appearance!.backgroundColor as BackgroundColorPreset)
        : DEFAULT_USER_SETTINGS.appearance.backgroundColor;

    const defaultDuration = [2, 4, 6, 8].includes(parsed.creative?.defaultSlideshowDuration ?? 0)
      ? Number(parsed.creative?.defaultSlideshowDuration)
      : DEFAULT_USER_SETTINGS.creative.defaultSlideshowDuration;

    const validAspects: PageAspectRatio[] = ["16:9", "3:4", "1:1", "4:3", "9:16"];
    const defaultAspectRatio: PageAspectRatio =
      validAspects.includes(parsed.creative?.defaultAspectRatio as PageAspectRatio)
        ? (parsed.creative!.defaultAspectRatio as PageAspectRatio)
        : DEFAULT_USER_SETTINGS.creative.defaultAspectRatio;

    return {
      version: 1,
      appearance: {
        theme: appearanceTheme,
        backgroundColor: appearanceBg,
      },
      creative: {
        defaultOutputFormat:
          parsed.creative?.defaultOutputFormat === "graphic_novel" ||
          parsed.creative?.defaultOutputFormat === "storyboard" ||
          parsed.creative?.defaultOutputFormat === "visual_book"
            ? parsed.creative.defaultOutputFormat
            : DEFAULT_USER_SETTINGS.creative.defaultOutputFormat,
        defaultAspectRatio,
        preferredArtStyle:
          typeof parsed.creative?.preferredArtStyle === "string"
            ? parsed.creative.preferredArtStyle
            : DEFAULT_USER_SETTINGS.creative.preferredArtStyle,
        defaultPaletteMood:
          typeof parsed.creative?.defaultPaletteMood === "string"
            ? parsed.creative.defaultPaletteMood
            : DEFAULT_USER_SETTINGS.creative.defaultPaletteMood,
        defaultSlideshowDuration: defaultDuration,
      },
      ai: {
        preferredEngine:
          parsed.ai?.preferredEngine === "cloudflare" || parsed.ai?.preferredEngine === "offline_procedural"
            ? parsed.ai.preferredEngine
            : DEFAULT_USER_SETTINGS.ai.preferredEngine,
        enableHighFidelityDemo: Boolean(parsed.ai?.enableHighFidelityDemo),
        customApiKeyMasked:
          typeof parsed.ai?.customApiKeyMasked === "string" ? parsed.ai.customApiKeyMasked : null,
      },
      dataPrivacy: {
        storageMode: "local_browser",
      },
      updatedAt: parsed.updatedAt || DEFAULT_USER_SETTINGS.updatedAt,
    };
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

export function saveUserSettings(
  updates: Partial<{
    appearance: Partial<UserSettings["appearance"]>;
    creative: Partial<UserSettings["creative"]>;
    ai: Partial<UserSettings["ai"]>;
    dataPrivacy: Partial<UserSettings["dataPrivacy"]>;
  }>,
): UserSettings {
  const current = getUserSettings();
  const now = new Date().toISOString();

  const next: UserSettings = {
    version: 1,
    appearance: {
      ...current.appearance,
      ...(updates.appearance || {}),
    },
    creative: {
      ...current.creative,
      ...(updates.creative || {}),
    },
    ai: {
      ...current.ai,
      ...(updates.ai || {}),
    },
    dataPrivacy: {
      storageMode: "local_browser",
    },
    updatedAt: now,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      applyTheme(next.appearance.theme);
      applyCanvasBackground(next.appearance.backgroundColor);
      window.dispatchEvent(new Event(PREFERENCES_EVENT));
    } catch {
      // Storage unavailable fallback
    }
  }

  return next;
}

export function applyTheme(theme: ThemePreference): void {
  if (typeof window === "undefined" || !document?.documentElement) return;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export function applyCanvasBackground(color: BackgroundColorPreset): void {
  if (typeof window === "undefined" || !document?.documentElement) return;
  document.documentElement.setAttribute("data-canvas-bg", color);
  window.dispatchEvent(new Event("vizzy:canvas-bg-change"));
}

export function subscribeCanvasBackground(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(PREFERENCES_EVENT, callback);
  window.addEventListener("vizzy:canvas-bg-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREFERENCES_EVENT, callback);
    window.removeEventListener("vizzy:canvas-bg-change", callback);
  };
}

export function getCanvasBackgroundSnapshot(): BackgroundColorPreset {
  if (typeof window === "undefined") return "warm_paper";
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return "warm_paper";
    const parsed = JSON.parse(raw);
    const valid: BackgroundColorPreset[] = [
      "warm_paper",
      "soft_grey",
      "white",
      "charcoal",
      "deep_black",
      "deep_navy",
      "dark_purple",
      "dark_teal",
    ];
    return valid.includes(parsed?.appearance?.backgroundColor)
      ? parsed.appearance.backgroundColor
      : "warm_paper";
  } catch {
    return "warm_paper";
  }
}

export function subscribeToPreferences(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === PROFILE_STORAGE_KEY || event.key === SETTINGS_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(PREFERENCES_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(PREFERENCES_EVENT, listener);
  };
}
