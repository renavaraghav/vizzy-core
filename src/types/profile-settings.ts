import type { PageAspectRatio, VisualOutputType } from "@/types/domain";

export type ThemePreference = "dark" | "light" | "system";

export type StoryEnginePreference = "cloudflare" | "offline_procedural";

export interface UserProfile {
  id: string;
  displayName: string;
  email: string | null;
  bio: string;
  preferredStoryFormat: VisualOutputType;
  avatarInitials: string;
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BackgroundColorPreset =
  | "warm_paper"
  | "soft_grey"
  | "white"
  | "charcoal"
  | "deep_black"
  | "deep_navy"
  | "dark_purple"
  | "dark_teal";

export interface AppearanceSettings {
  theme: ThemePreference;
  backgroundColor: BackgroundColorPreset;
}

export interface CreativePreferences {
  defaultOutputFormat: VisualOutputType;
  defaultAspectRatio: PageAspectRatio;
  preferredArtStyle: string;
  defaultPaletteMood: string;
  defaultSlideshowDuration: number; // 2, 4, 6, 8 seconds
}

export interface AISettings {
  preferredEngine: StoryEnginePreference;
  enableHighFidelityDemo: boolean;
  customApiKeyMasked: string | null;
}

export interface DataPrivacySettings {
  storageMode: "local_browser" | "cloud_synced";
}

export interface UserSettings {
  version: 1;
  appearance: AppearanceSettings;
  creative: CreativePreferences;
  ai: AISettings;
  dataPrivacy: DataPrivacySettings;
  updatedAt: string;
}

export interface AuthState {
  status: "unauthenticated" | "authenticated";
  isGuest: boolean;
  user: {
    id: string;
    email: string | null;
    displayName: string;
  } | null;
}
