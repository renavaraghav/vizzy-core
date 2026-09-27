import type {
  ChatAction,
  ChatMessage,
  ImageVersion,
  PageBeat,
  PageCreativeSettings,
  Project,
} from "@/types/domain";

function createId(prefix: string) {
  const uniquePart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${uniquePart}`;
}

export function createAssistantMessage(
  content: string,
  options?: {
    pageId?: string;
    imageOptions?: ImageVersion[];
    actions?: ChatAction[];
  },
): ChatMessage {
  return {
    id: createId("msg"),
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
    pageId: options?.pageId,
    imageOptions: options?.imageOptions,
    actions: options?.actions,
  };
}

export function createUserMessage(content: string): ChatMessage {
  return {
    id: createId("msg"),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  };
}

export interface DetectedIntent {
  type:
    | "select_option"
    | "generate_options"
    | "refine_image"
    | "next_page"
    | "prev_page"
    | "play_slideshow"
    | "create_story"
    | "chat_general";
  optionIndex?: number;
  refinementText?: string;
  pageNumber?: number;
}

export function parseConversationalIntent(text: string): DetectedIntent {
  const raw = text.trim().toLowerCase();

  // 1. Select option
  const optMatch = raw.match(/(?:option|choice|image|version|pick|select|take)\s*#?([1-3])/i) ||
    raw.match(/^([1-3])$/);
  if (optMatch) {
    const idx = parseInt(optMatch[1], 10) - 1;
    if (idx >= 0 && idx <= 2) {
      return { type: "select_option", optionIndex: idx };
    }
  }

  // 2. Play Slideshow / Video Loop
  if (
    raw.includes("slideshow") ||
    raw.includes("play loop") ||
    raw.includes("video") ||
    raw.includes("watch story") ||
    raw.includes("present")
  ) {
    return { type: "play_slideshow" };
  }

  // 3. Next page / Move forward
  if (
    raw.includes("next page") ||
    raw.includes("next image") ||
    raw.includes("next beat") ||
    raw.includes("move forward") ||
    raw.includes("move on") ||
    raw === "next"
  ) {
    return { type: "next_page" };
  }

  // 4. Previous page
  if (
    raw.includes("previous page") ||
    raw.includes("prev page") ||
    raw.includes("go back") ||
    raw === "back"
  ) {
    return { type: "prev_page" };
  }

  // 5. Generate options
  if (
    raw.includes("generate") ||
    raw.includes("draw") ||
    raw.includes("create options") ||
    raw.includes("show options") ||
    raw.includes("render")
  ) {
    return { type: "generate_options" };
  }

  // 6. Refinement request
  if (
    raw.includes("make it") ||
    raw.includes("change") ||
    raw.includes("add more") ||
    raw.includes("darker") ||
    raw.includes("lighter") ||
    raw.includes("closer") ||
    raw.includes("wider") ||
    raw.includes("rain") ||
    raw.includes("smoke") ||
    raw.includes("zoom") ||
    raw.includes("more ")
  ) {
    return { type: "refine_image", refinementText: text.trim() };
  }

  return { type: "chat_general" };
}

// Generate intelligent contextual graphic novel page beats
export function generatePageBeatDetails(
  project: Project,
  pageIndex: number,
  userNotes?: string,
): {
  title: string;
  description: string;
  visualDirection: string;
  narration: string;
  dialogue: string;
  settings: Partial<PageCreativeSettings>;
} {
  const story = (project.description || "").toLowerCase();
  const isDDay = story.includes("d-day") || story.includes("war") || story.includes("normandy") || story.includes("omaha");
  const isSciFi = story.includes("cyber") || story.includes("neon") || story.includes("robot") || story.includes("space");

  if (isDDay) {
    const beats = [
      {
        title: "Approaching Omaha Beach",
        description: "Inside a Higgins boat landing craft churning through rough grey waters under dawn mist and distant smoke.",
        visualDirection: "Low angle inside the landing craft. Cold ocean spray splashing, tense faces under green M1 helmets, artillery geysers in the distance.",
        narration: "Dawn, June 6. The diesel fumes hung heavy in the spray as the coast of Normandy emerged through the mist.",
        dialogue: "Capt. Miller: 'Thirty seconds! Clear the ramp and keep moving!'",
        settings: {
          cameraAngle: "Low angle",
          shotType: "Medium shot",
          lighting: "Dramatic contrast",
          emotionalTone: "Tense, breathless anticipation",
          composition: "Framed from within landing craft looking out over steel bow",
          aspectRatio: "16:9" as const,
        },
      },
      {
        title: "The Ramp Drops",
        description: "The metal ramp splashes down into waist-deep churning surf under blistering machine gun fire.",
        visualDirection: "High-action wide angle. Water erupting from bullets, soldiers plunging into waves, smoke swirling across grey sand.",
        narration: "The ramp struck water with a deafening clang. In an instant, the world turned into lead and saltwater.",
        dialogue: "Sgt. Horvath: 'Go, go, go! Don't stop in the surf!'",
        settings: {
          cameraAngle: "Eye level",
          shotType: "Wide shot",
          lighting: "Diffused stormy daylight with muzzle flashes",
          emotionalTone: "Chaos, visceral kinetic energy",
          composition: "Soldiers surging through breakers with Czech hedgehogs on horizon",
          aspectRatio: "16:9" as const,
        },
      },
      {
        title: "Pinned at the Shingle",
        description: "Soldiers take cover behind wooden stakes and steel hedgehogs while smoke blankets the bluffs.",
        visualDirection: "Tight composition close to wet sand. Soldier looking up through raindrops on glasses, mortar explosions throwing dark earth into air.",
        narration: "Every inch of sand was contested. The sea wall stood fifty yards away, through an open gauntlet of fire.",
        dialogue: "Pvt. Ryan: 'Captain, we can't stay here! We're sitting ducks!'",
        settings: {
          cameraAngle: "Dutch angle",
          shotType: "Close-up",
          lighting: "Dark overcast with fiery orange blast highlights",
          emotionalTone: "Claustrophobic, gritty desperation",
          composition: "Foreground soldier silhouette with background bunker fire",
          aspectRatio: "16:9" as const,
        },
      },
      {
        title: "Breaching the Shingle",
        description: "Engineers plant Bangalore torpedoes against the barbed wire barricade beneath the bluffs.",
        visualDirection: "Dynamic action mid-angle. Sparks flying from detonation cord, soldiers huddled preparing to charge the gap.",
        narration: "The blast tore through the wire entanglement, opening a ragged path up the grassy slopes.",
        dialogue: "Capt. Miller: 'Fire in the hole! As soon as it blows, we push!'",
        settings: {
          cameraAngle: "Low angle",
          shotType: "Medium shot",
          lighting: "Explosive flash lighting up concrete bunker above",
          emotionalTone: "Decisive breakthrough courage",
          composition: "Soldiers crouched at edge of crater as smoke billows",
          aspectRatio: "16:9" as const,
        },
      },
      {
        title: "Securing the Ridge",
        description: "Allied soldiers reach the top of the bluff, looking out over the conquered beachhead as support ships gather.",
        visualDirection: "Majestic wide panoramic landscape. Weary soldiers silhouetted on ridge, naval armada stretching to the horizon beneath breaking clouds.",
        narration: "By late afternoon, the guns fell silent along the ridge. Below, the endless armada filled the sea as far as the eye could see.",
        dialogue: "Capt. Miller: 'We hold the high ground. Send word to command.'",
        settings: {
          cameraAngle: "High angle",
          shotType: "Wide shot",
          lighting: "Golden hour sunset breaking through grey clouds",
          emotionalTone: "Somber, monumental triumph",
          composition: "Silhouetted soldiers overlooking vast armada and ocean",
          aspectRatio: "16:9" as const,
        },
      },
    ];

    const beat = beats[pageIndex % beats.length];
    if (userNotes) {
      return {
        ...beat,
        title: userNotes.slice(0, 36) || beat.title,
        description: `${beat.description} ${userNotes}`,
      };
    }
    return beat;
  }

  // Sci-Fi / Cyberpunk default
  if (isSciFi) {
    const beatIndex = pageIndex + 1;
    return {
      title: `Neon Sector Beat ${beatIndex}`,
      description: `Sprawling cybernetic cityscape soaked in relentless acid rain with towering holographic advertisements.`,
      visualDirection: `High contrast neon cyberpunk style. Deep indigo shadows, electric cyan and hot magenta neon reflections on wet asphalt.`,
      narration: `The rain never stopped in the Lower District. It just washed the neon down into the gutters.`,
      dialogue: `Kael: 'Check the data link. They know we're here.'`,
      settings: {
        cameraAngle: "Dutch angle",
        shotType: "Wide shot",
        lighting: "Neon glow and deep street shadows",
        emotionalTone: "Gritty neo-noir cyber thriller",
        composition: "Futuristic street alley framed by glowing signs",
        aspectRatio: "16:9",
      },
    };
  }

  // Universal cinematic story beat
  const beatIndex = pageIndex + 1;
  return {
    title: userNotes ? userNotes.slice(0, 40) : `Scene Beat ${beatIndex}`,
    description: userNotes || `Key narrative beat ${beatIndex} establishing the character's journey and escalating stakes.`,
    visualDirection: `${project.styleBible.artStyle || "Cinematic graphic novel"}. ${project.styleBible.palette || "Atmospheric color grading"}.`,
    narration: `As the journey unfolded, the consequences of that day became undeniable.`,
    dialogue: `“We keep moving forward. There is no turning back now.”`,
    settings: {
      cameraAngle: "Eye level",
      shotType: "Medium shot",
      lighting: project.styleBible.mood || "Atmospheric cinematic lighting",
      emotionalTone: project.styleBible.mood || "Engaging and dramatic",
      composition: "Rule of thirds cinematic framing",
      aspectRatio: "16:9",
    },
  };
}
