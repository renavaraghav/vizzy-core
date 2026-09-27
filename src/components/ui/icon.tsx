import type { SVGProps } from "react";

export type IconName =
  | "story"
  | "palette"
  | "characters"
  | "pages"
  | "settings"
  | "chevron"
  | "sparkles"
  | "plus"
  | "send"
  | "more"
  | "sidebar"
  | "play"
  | "pause"
  | "slideshow"
  | "download"
  | "refresh"
  | "close"
  | "check"
  | "key"
  | "trash"
  | "search"
  | "sun"
  | "moon";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const paths: Record<IconName, React.ReactNode> = {
  story: (
    <>
      <path d="M6 3.75h9A2.25 2.25 0 0 1 17.25 6v12H8.5A2.5 2.5 0 0 0 6 20.5V3.75Z" />
      <path d="M6 20.25h11.25M9.5 8h4.25M9.5 11.5h4.25" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 0 0 0 18h1.25a1.8 1.8 0 0 0 1.18-3.16 1.55 1.55 0 0 1 1.02-2.72H17A4 4 0 0 0 21 11.1 8.14 8.14 0 0 0 12 3Z" />
      <path d="M7.5 11.25h.01M9.25 7.5h.01M14 6.75h.01M17.25 9.25h.01" />
    </>
  ),
  characters: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.75 19a5.25 5.25 0 0 1 10.5 0M15.5 5.4a3 3 0 0 1 0 5.8M16.5 14a4.5 4.5 0 0 1 3.75 4.45" />
    </>
  ),
  pages: (
    <>
      <rect x="5" y="3.5" width="12" height="17" rx="1.75" />
      <path d="M9 7.5h4M9 11h4M9 14.5h2.5M17 7h2a1 1 0 0 1 1 1v10" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14H3v-4h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3h4v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9 1.7 1.7 0 0 0 21 10v4a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  chevron: <path d="m9 7 5 5-5 5" />,
  sparkles: (
    <>
      <path d="m12 3 1.15 3.1L16 7.5l-2.85 1.4L12 12l-1.15-3.1L8 7.5l2.85-1.4L12 3Z" />
      <path d="m18.25 13.5.72 1.78 1.78.72-1.78.72-.72 1.78-.72-1.78-1.78-.72 1.78-.72.72-1.78ZM6 13l.9 2.1L9 16l-2.1.9L6 19l-.9-2.1L3 16l2.1-.9L6 13Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  send: (
    <>
      <path d="m5 12 14-7-4 14-3.2-5.8L5 12Z" />
      <path d="M11.8 13.2 19 5" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  sidebar: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  play: <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" fill="currentColor" />
      <rect x="14" y="4" width="4" height="16" fill="currentColor" />
    </>
  ),
  slideshow: (
    <>
      <rect x="2" y="3" width="20" height="15" rx="2" />
      <polygon points="10 7 15 10.5 10 14 10 7" fill="currentColor" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  refresh: (
    <>
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </>
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  check: <polyline points="20 6 9 17 4 12" />,
  key: (
    <>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.7 12.3 8.3-8.3h3v3l-2 2v2l-2 2" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7.5" />
      <path d="m21 21-4.35-4.35" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
