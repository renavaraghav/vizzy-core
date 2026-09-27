import sharp from "sharp";
import type { PageAspectRatio } from "@/types/domain";

interface RenderOptions {
  prompt: string;
  aspectRatio: PageAspectRatio;
  optionIndex: number;
  totalOptions: number;
}

interface PaletteTheme {
  skyTop: string;
  skyBottom: string;
  ground: string;
  accent: string;
  highlight: string;
  shadow: string;
  filter: string;
}

function analyzePrompt(prompt: string): {
  theme: "war" | "noir" | "cyberpunk" | "fantasy" | "nature" | "cinematic";
  timeOfDay: "night" | "dawn" | "storm" | "day";
  elements: string[];
} {
  const p = prompt.toLowerCase();
  
  let theme: "war" | "noir" | "cyberpunk" | "fantasy" | "nature" | "cinematic" = "cinematic";
  if (p.includes("war") || p.includes("d-day") || p.includes("battle") || p.includes("soldier") || p.includes("boat") || p.includes("beach") || p.includes("military") || p.includes("normandy")) {
    theme = "war";
  } else if (p.includes("cyber") || p.includes("neon") || p.includes("future") || p.includes("sci-fi") || p.includes("robot")) {
    theme = "cyberpunk";
  } else if (p.includes("noir") || p.includes("detective") || p.includes("shadow") || p.includes("crime") || p.includes("rainy street")) {
    theme = "noir";
  } else if (p.includes("magic") || p.includes("fantasy") || p.includes("dragon") || p.includes("castle") || p.includes("forest")) {
    theme = "fantasy";
  } else if (p.includes("nature") || p.includes("mountain") || p.includes("ocean") || p.includes("sea") || p.includes("sunset")) {
    theme = "nature";
  }

  let timeOfDay: "night" | "dawn" | "storm" | "day" = "day";
  if (p.includes("rain") || p.includes("storm") || p.includes("mist") || p.includes("fog") || p.includes("thunder")) {
    timeOfDay = "storm";
  } else if (p.includes("night") || p.includes("dark") || p.includes("midnight") || p.includes("moon")) {
    timeOfDay = "night";
  } else if (p.includes("dawn") || p.includes("dusk") || p.includes("sunset") || p.includes("sunrise") || p.includes("golden hour")) {
    timeOfDay = "dawn";
  }

  const elements: string[] = [];
  if (p.includes("boat") || p.includes("craft") || p.includes("ship") || p.includes("higgins")) elements.push("vessels");
  if (p.includes("explosion") || p.includes("fire") || p.includes("smoke") || p.includes("flash")) elements.push("smoke_fire");
  if (p.includes("soldier") || p.includes("troop") || p.includes("person") || p.includes("figure") || p.includes("captain")) elements.push("soldiers");
  if (p.includes("beach") || p.includes("water") || p.includes("waves") || p.includes("sea")) elements.push("beach_sea");

  return { theme, timeOfDay, elements };
}

function getPalette(theme: string, timeOfDay: string, variation: number): PaletteTheme {
  if (theme === "war") {
    if (timeOfDay === "storm" || timeOfDay === "dawn") {
      return variation === 0
        ? { skyTop: "#2b3438", skyBottom: "#525c5a", ground: "#1f2420", accent: "#d9652a", highlight: "#e5b172", shadow: "#121714", filter: "contrast(1.2)" }
        : variation === 1
        ? { skyTop: "#1c262b", skyBottom: "#3d4b52", ground: "#151c19", accent: "#f07835", highlight: "#ffe49e", shadow: "#0e1310", filter: "contrast(1.35)" }
        : { skyTop: "#3a3835", skyBottom: "#5a564e", ground: "#24221e", accent: "#e05424", highlight: "#fce1a9", shadow: "#181614", filter: "contrast(1.15)" };
    }
    return { skyTop: "#3d4447", skyBottom: "#6b7270", ground: "#2c332c", accent: "#d45828", highlight: "#edd4a4", shadow: "#191f1a", filter: "contrast(1.2)" };
  }

  if (theme === "noir") {
    return { skyTop: "#0f1115", skyBottom: "#20252d", ground: "#080a0c", accent: "#d4af37", highlight: "#e8eff7", shadow: "#030405", filter: "grayscale(0.85) contrast(1.4)" };
  }

  if (theme === "cyberpunk") {
    return variation === 0
      ? { skyTop: "#0d091e", skyBottom: "#21163e", ground: "#080612", accent: "#00f0ff", highlight: "#ff007b", shadow: "#04030a", filter: "contrast(1.25) saturate(1.4)" }
      : { skyTop: "#160926", skyBottom: "#341355", ground: "#090310", accent: "#ff007b", highlight: "#00f0ff", shadow: "#050109", filter: "contrast(1.3) saturate(1.5)" };
  }

  // Cinematic default
  return variation === 0
    ? { skyTop: "#1c2230", skyBottom: "#384556", ground: "#151b24", accent: "#d48b47", highlight: "#f7d8ba", shadow: "#0d1117", filter: "contrast(1.15)" }
    : variation === 1
    ? { skyTop: "#251c30", skyBottom: "#4a3b5c", ground: "#1a1322", accent: "#e59866", highlight: "#fae5d3", shadow: "#100b16", filter: "contrast(1.2)" }
    : { skyTop: "#182828", skyBottom: "#304d4a", ground: "#101e1e", accent: "#48c9b0", highlight: "#d1f2eb", shadow: "#091212", filter: "contrast(1.1)" };
}

export async function renderGraphicNovelArtwork({
  prompt,
  aspectRatio,
  optionIndex,
  totalOptions,
}: RenderOptions): Promise<Buffer> {
  const width =
    aspectRatio === "16:9"
      ? 1536
      : aspectRatio === "4:3"
      ? 1365
      : aspectRatio === "9:16"
      ? 768
      : 1024;
  const height =
    aspectRatio === "16:9"
      ? 864
      : aspectRatio === "4:3"
      ? 1024
      : aspectRatio === "9:16"
      ? 1365
      : aspectRatio === "1:1"
      ? 1024
      : 1365;

  const analysis = analyzePrompt(prompt);
  const palette = getPalette(analysis.theme, analysis.timeOfDay, optionIndex);

  const horizonY = height * (optionIndex === 0 ? 0.58 : optionIndex === 1 ? 0.65 : 0.48);
  const compositionType =
    optionIndex === 0
      ? "Cinematic Wide Panorama"
      : optionIndex === 1
      ? "Dynamic Mid-Action Frame"
      : "Close Emotional Focus";

  // Build thematic SVG layers
  let specificIllustrationSvg = "";

  if (analysis.theme === "war") {
    // Military / Normandy / D-Day visual layers
    const boatX = width * (0.2 + optionIndex * 0.25);
    const boatY = horizonY + (height - horizonY) * 0.25;

    // Distant battleships on the horizon
    const distantShips = `
      <!-- Distant Fleet on Horizon -->
      <path d="M ${width * 0.08} ${horizonY - 8} l 28 -3 l 14 0 l 8 3 l -50 0 z" fill="${palette.shadow}" opacity="0.6" />
      <rect x="${width * 0.1}" y="${horizonY - 18}" width="3" height="10" fill="${palette.shadow}" opacity="0.5" />
      <path d="M ${width * 0.82} ${horizonY - 6} l 35 -4 l 18 0 l 10 4 l -63 0 z" fill="${palette.shadow}" opacity="0.5" />
      <rect x="${width * 0.85}" y="${horizonY - 16}" width="4" height="10" fill="${palette.shadow}" opacity="0.4" />
    `;

    // Explosions / Smoke plumes
    const smokePlumes = `
      <!-- Atmospheric Smoke and Artillery Flashes -->
      <defs>
        <radialGradient id="blast1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${palette.highlight}" stop-opacity="0.95" />
          <stop offset="25%" stop-color="${palette.accent}" stop-opacity="0.8" />
          <stop offset="65%" stop-color="${palette.skyTop}" stop-opacity="0.4" />
          <stop offset="100%" stop-color="${palette.skyTop}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="smoke1" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stop-color="#1b1c1d" stop-opacity="0.75" />
          <stop offset="50%" stop-color="#34373a" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#34373a" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="${width * 0.72}" cy="${horizonY - height * 0.12}" r="${width * 0.16}" fill="url(#smoke1)" />
      <circle cx="${width * 0.68}" cy="${horizonY - height * 0.05}" r="${width * 0.08}" fill="url(#blast1)" />
      <circle cx="${width * 0.28}" cy="${horizonY - height * 0.08}" r="${width * 0.12}" fill="url(#smoke1)" />
    `;

    // Sea waves / churned foam
    const waves = `
      <!-- Churned Sea Waves and Wet Beach -->
      <path d="M 0 ${horizonY} Q ${width * 0.25} ${horizonY + 25} ${width * 0.5} ${horizonY + 10} T ${width} ${horizonY + 30} L ${width} ${height} L 0 ${height} Z" fill="${palette.ground}" />
      <path d="M 0 ${horizonY + 40} Q ${width * 0.3} ${horizonY + 80} ${width * 0.65} ${horizonY + 45} T ${width} ${horizonY + 90} L ${width} ${height} L 0 ${height} Z" fill="${palette.shadow}" opacity="0.65" />
      <path d="M 0 ${horizonY + 12} Q ${width * 0.3} ${horizonY + 28} ${width * 0.6} ${horizonY + 15} T ${width} ${horizonY + 25}" stroke="${palette.highlight}" stroke-width="3" fill="none" opacity="0.45" />
      <path d="M ${width * 0.1} ${horizonY + 65} Q ${width * 0.4} ${horizonY + 105} ${width * 0.8} ${horizonY + 70}" stroke="${palette.highlight}" stroke-width="4" stroke-dasharray="12,18" fill="none" opacity="0.5" />
    `;

    // Beach Obstacles (Hedgehogs / Czech hedgehogs)
    const hedgehogs = `
      <!-- Czech Hedgehogs (Anti-tank Beach Obstacles) -->
      <g stroke="${palette.shadow}" stroke-width="12" stroke-linecap="round" opacity="0.95">
        <line x1="${width * 0.15}" y1="${height * 0.88}" x2="${width * 0.25}" y2="${height * 0.72}" />
        <line x1="${width * 0.25}" y1="${height * 0.88}" x2="${width * 0.15}" y2="${height * 0.72}" />
        <line x1="${width * 0.2}" y1="${height * 0.9}" x2="${width * 0.2}" y2="${height * 0.7}" />
        
        <line x1="${width * 0.78}" y1="${height * 0.84}" x2="${width * 0.86}" y2="${height * 0.71}" stroke-width="10" />
        <line x1="${width * 0.86}" y1="${height * 0.84}" x2="${width * 0.78}" y2="${height * 0.71}" stroke-width="10" />
      </g>
    `;

    // Landing Craft (Higgins boat) or Soldiers
    const boatAndSoldiers =
      optionIndex === 2
        ? `
        <!-- Option 3: Intense Close-Up / Interior Framing -->
        <g fill="${palette.shadow}">
          <!-- Foreground Boat Ramp & Helmets -->
          <polygon points="0,${height * 0.55} ${width * 0.45},${height * 0.65} ${width * 0.45},${height} 0,${height}" />
          <!-- Soldier in foreground -->
          <ellipse cx="${width * 0.55}" cy="${height * 0.62}" rx="${width * 0.13}" ry="${height * 0.11}" />
          <!-- M1 Helmet rim -->
          <path d="M ${width * 0.38} ${height * 0.62} Q ${width * 0.55} ${height * 0.51} ${width * 0.72} ${height * 0.62} Z" fill="${palette.ground}" />
          <!-- Torso silhouette with straps -->
          <path d="M ${width * 0.35} ${height * 0.7} Q ${width * 0.55} ${height * 0.65} ${width * 0.75} ${height * 0.7} L ${width * 0.82} ${height} L ${width * 0.28} ${height} Z" />
          <!-- Rifle barrel silhouette -->
          <line x1="${width * 0.68}" y1="${height * 0.45}" x2="${width * 0.65}" y2="${height * 0.85}" stroke="${palette.shadow}" stroke-width="14" stroke-linecap="round" />
        </g>
        <!-- Intense rim lighting on helmet -->
        <path d="M ${width * 0.42} ${height * 0.59} Q ${width * 0.55} ${height * 0.52} ${width * 0.68} ${height * 0.59}" stroke="${palette.accent}" stroke-width="5" fill="none" opacity="0.85" />
      `
        : `
        <!-- Options 1 & 2: Landing Craft & Soldiers Charging Beach -->
        <g fill="${palette.shadow}">
          <!-- Higgins Boat Hull -->
          <polygon points="${boatX - width * 0.18},${boatY + 15} ${boatX + width * 0.18},${boatY + 8} ${boatX + width * 0.15},${boatY + height * 0.12} ${boatX - width * 0.16},${boatY + height * 0.14}" />
          <!-- Open Ramp -->
          <polygon points="${boatX + width * 0.15},${boatY + 8} ${boatX + width * 0.28},${boatY + height * 0.16} ${boatX + width * 0.24},${boatY + height * 0.19} ${boatX + width * 0.13},${boatY + height * 0.13}" fill="${palette.ground}" />
          
          <!-- Soldiers storming into surf -->
          <ellipse cx="${boatX + width * 0.22}" cy="${boatY + height * 0.09}" rx="${width * 0.022}" ry="${height * 0.02}" />
          <path d="M ${boatX + width * 0.2} ${boatY + height * 0.11} l 10 35 l -18 20 l 12 0 l 14 -24 l 8 24 l 12 0 l -10 -40 z" />
          
          <ellipse cx="${boatX + width * 0.32}" cy="${boatY + height * 0.13}" rx="${width * 0.024}" ry="${height * 0.022}" />
          <path d="M ${boatX + width * 0.3} ${boatY + height * 0.15} l 12 30 l -14 25 l 10 0 l 14 -25 l 12 25 l 10 0 l -12 -38 z" />
          
          <ellipse cx="${boatX + width * 0.1}" cy="${boatY + height * 0.04}" rx="${width * 0.02}" ry="${height * 0.018}" />
          <path d="M ${boatX + width * 0.08} ${boatY + height * 0.06} l 8 25 l -10 18 l 10 0 l 10 -20 l 8 20 l 10 0 l -8 -30 z" />
        </g>
        
        <!-- Spray and water splash around the boat -->
        <path d="M ${boatX - width * 0.18} ${boatY + height * 0.12} Q ${boatX} ${boatY + height * 0.18} ${boatX + width * 0.22} ${boatY + height * 0.15}" stroke="${palette.highlight}" stroke-width="6" stroke-dasharray="15,20" fill="none" opacity="0.6" />
      `;

    specificIllustrationSvg = distantShips + smokePlumes + waves + hedgehogs + boatAndSoldiers;
  } else {
    // Versatile Cinematic Graphic Novel Landscape / Scene
    const hillCurve = `
      <path d="M 0 ${horizonY} Q ${width * 0.35} ${horizonY - 60} ${width * 0.7} ${horizonY + 20} T ${width} ${horizonY - 30} L ${width} ${height} L 0 ${height} Z" fill="${palette.ground}" />
      <path d="M 0 ${horizonY + 80} Q ${width * 0.4} ${horizonY + 120} ${width * 0.8} ${horizonY + 90} T ${width} ${height} L 0 ${height} Z" fill="${palette.shadow}" opacity="0.8" />
    `;
    const characterSilhouette = `
      <g fill="${palette.shadow}">
        <ellipse cx="${width * 0.5}" cy="${height * 0.68}" rx="${width * 0.035}" ry="${height * 0.03}" />
        <path d="M ${width * 0.46} ${height * 0.71} l 12 60 l -20 50 l 16 0 l 20 -50 l 20 50 l 16 0 l -18 -65 l -8 -45 z" />
      </g>
    `;
    specificIllustrationSvg = hillCurve + characterSilhouette;
  }

  // Rain / Atmospheric streaks
  let rainSvg = "";
  if (analysis.timeOfDay === "storm" || prompt.toLowerCase().includes("rain")) {
    rainSvg = `
      <g stroke="${palette.highlight}" stroke-width="1.5" stroke-dasharray="18,35" opacity="0.25">
        <line x1="${width * 0.1}" y1="0" x2="${width * 0.05}" y2="${height}" />
        <line x1="${width * 0.25}" y1="0" x2="${width * 0.2}" y2="${height}" />
        <line x1="${width * 0.4}" y1="0" x2="${width * 0.35}" y2="${height}" />
        <line x1="${width * 0.55}" y1="0" x2="${width * 0.5}" y2="${height}" />
        <line x1="${width * 0.7}" y1="0" x2="${width * 0.65}" y2="${height}" />
        <line x1="${width * 0.85}" y1="0" x2="${width * 0.8}" y2="${height}" />
        <line x1="${width * 0.95}" y1="0" x2="${width * 0.9}" y2="${height}" />
      </g>
    `;
  }

  // Comic Book Framing & Halftone Dot Filter simulation
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <!-- Sky Gradient -->
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${palette.skyTop}" />
          <stop offset="100%" stop-color="${palette.skyBottom}" />
        </linearGradient>

        <!-- Vignette Mask -->
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="40%" stop-color="#000000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.65" />
        </radialGradient>

        <!-- Halftone Pattern -->
        <pattern id="halftone" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="1.5" fill="#000000" opacity="0.08" />
        </pattern>
      </defs>

      <!-- Background Sky -->
      <rect width="${width}" height="${height}" fill="url(#skyGrad)" />

      <!-- Thematic Scene Content -->
      ${specificIllustrationSvg}

      <!-- Atmospheric Rain / Streaks -->
      ${rainSvg}

      <!-- Halftone Comic Overlay -->
      <rect width="${width}" height="${height}" fill="url(#halftone)" style="mix-blend-mode: overlay;" />

      <!-- Vignette Lighting -->
      <rect width="${width}" height="${height}" fill="url(#vignette)" />

      <!-- Graphic Novel Inner Frame Border -->
      <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2" />
      <rect x="28" y="28" width="${width - 56}" height="${height - 56}" fill="none" stroke="#000000" stroke-opacity="0.4" stroke-width="1.5" />

      <!-- Comic Corner Stamp / Option Badge -->
      <g transform="translate(42, ${height - 54})">
        <rect width="180" height="28" rx="6" fill="#141514" fill-opacity="0.88" stroke="#ffffff" stroke-opacity="0.15" />
        <text x="14" y="18" fill="#e5e5e0" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="1.5">
          OPTION ${optionIndex + 1} · ${compositionType.toUpperCase()}
        </text>
      </g>
    </svg>
  `;

  // Convert SVG string to high-quality PNG Buffer using sharp
  const buffer = await sharp(Buffer.from(svg))
    .png({ quality: 90 })
    .toBuffer();

  return buffer;
}
